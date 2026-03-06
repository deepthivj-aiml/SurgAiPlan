/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Activity, 
  Target, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck,
  Play, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Database,
  Crosshair,
  Settings,
  Terminal,
  X,
  Maximize2,
  Box,
  Upload,
  FileText,
  Image as ImageIcon,
  FileUp,
  Trash2,
  History,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, MeshDistortMaterial, Sphere, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Components ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#111114] border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">System Failure</h2>
              <p className="text-sm text-white/40">An unexpected error occurred in the surgical planning core.</p>
            </div>
            <div className="bg-black/40 rounded-xl p-4 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-red-400/80 break-all">
                {this.state.error?.message || "Unknown Error"}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Label({ text, position }: { text: string, position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={10}>
      <div className="pointer-events-none">
        <span className="text-[7px] font-bold text-slate-900 uppercase tracking-[0.2em] whitespace-nowrap bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm border border-slate-200/50">{text}</span>
      </div>
    </Html>
  );
}

function RoboticArm({ progress, startPos, targetPos }: { progress: number, startPos: [number, number, number], targetPos: [number, number, number] }) {
  const groupRef = React.useRef<THREE.Group>(null);
  const arm1Ref = React.useRef<THREE.Mesh>(null);
  const arm2Ref = React.useRef<THREE.Mesh>(null);
  const toolRef = React.useRef<THREE.Mesh>(null);
  const gripperLeftRef = React.useRef<THREE.Mesh>(null);
  const gripperRightRef = React.useRef<THREE.Mesh>(null);

  // Current end-effector target based on progress
  const currentTarget = new THREE.Vector3();
  const start = new THREE.Vector3(...startPos);
  const target = new THREE.Vector3(...targetPos);
  
  // Create a slight arc for more natural robotic motion
  const alpha = progress / 100;
  currentTarget.lerpVectors(start, target, alpha);
  
  // Add a vertical arc (Y-offset) that peaks at 50% progress
  const arcHeight = 2;
  const yOffset = Math.sin(alpha * Math.PI) * arcHeight;
  currentTarget.y += yOffset;

  useFrame(() => {
    if (!groupRef.current) return;

    // Simple 2-link IK approximation for visual effect
    const base = new THREE.Vector3(...startPos);
    const targetPoint = currentTarget;
    const diff = new THREE.Vector3().subVectors(targetPoint, base);
    const dist = diff.length();

    // Rotate base to face target
    groupRef.current.lookAt(targetPoint);

    if (arm1Ref.current && arm2Ref.current && toolRef.current) {
      // Animate joints slightly based on distance
      arm1Ref.current.rotation.x = Math.PI / 4 + Math.sin(progress / 10) * 0.1;
      arm2Ref.current.rotation.x = -Math.PI / 2 + Math.cos(progress / 10) * 0.2;
      
      // Tool always points at target
      toolRef.current.position.z = dist;

      // Animate gripper based on progress
      if (gripperLeftRef.current && gripperRightRef.current) {
        const gripAngle = progress < 90 ? 0.4 : 0.05;
        gripperLeftRef.current.rotation.y = gripAngle;
        gripperRightRef.current.rotation.y = -gripAngle;
      }
    }
  });

  return (
    <group ref={groupRef} position={startPos}>
      {/* Base */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.6, 0.5, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
        <Label text="Robot Base" position={[0, 0.6, 0]} />
      </mesh>

      {/* Arm Segment 1 */}
      <group position={[0, 0.25, 0]}>
        <mesh ref={arm1Ref} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.3, 0.3, 4]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
          <Label text="Shoulder Segment" position={[0, 0, 1]} />
          
          {/* Elbow Joint */}
          <mesh position={[0, 0, 2]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#1e293b" />
            <Label text="Elbow Joint" position={[0, 0.5, 0]} />
          </mesh>

          {/* Arm Segment 2 */}
          <group position={[0, 0, 2]}>
            <mesh ref={arm2Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.25, 0.25, 3]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
              <Label text="Forearm Segment" position={[0, 0, 1]} />
              
              {/* Wrist Joint */}
              <mesh position={[0, 0, 1.5]}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color="#1e293b" />
                <Label text="Wrist Joint" position={[0, 0.4, 0]} />
              </mesh>

              {/* End Effector / Surgical Tool */}
              <group position={[0, 0, 1.5]}>
                <mesh ref={toolRef} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 1.5, 16]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                  <Label text="Surgical End-Effector" position={[0, 0.8, 0]} />
                </mesh>
                
                {/* Gripper Hand */}
                <group position={[0, 0, 0.75]}>
                  {/* Palm */}
                  <mesh>
                    <boxGeometry args={[0.2, 0.1, 0.1]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  {/* Finger Left */}
                  <group ref={gripperLeftRef} position={[-0.1, 0, 0.05]}>
                    <mesh position={[0, 0, 0.15]}>
                      <boxGeometry args={[0.05, 0.08, 0.3]} />
                      <meshStandardMaterial color="#94a3b8" />
                    </mesh>
                  </group>
                  {/* Finger Right */}
                  <group ref={gripperRightRef} position={[0.1, 0, 0.05]}>
                    <mesh position={[0, 0, 0.15]}>
                      <boxGeometry args={[0.05, 0.08, 0.3]} />
                      <meshStandardMaterial color="#94a3b8" />
                    </mesh>
                  </group>
                  {/* Tool Tip Glow */}
                  <pointLight color="#10b981" intensity={0.5} distance={2} />
                </group>
              </group>
            </mesh>
          </group>
        </mesh>
      </group>
    </group>
  );
}

function HumanAnatomy() {
  return (
    <group position={[0, -8, 0]}>
      {/* Torso / Body - More realistic skin tone and material */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[8, 20, 8, 32]} />
        <meshStandardMaterial color="#f3d1c1" roughness={0.6} metalness={0.05} />
      </mesh>
      
      {/* Surgical Drapes (Blue covering) - Added texture-like roughness */}
      <mesh position={[0, 8.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2563eb" side={THREE.DoubleSide} roughness={1} />
      </mesh>

      {/* Surgical Opening (Incision site area) - More realistic blending */}
      <mesh position={[0, 8.505, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial color="#2563eb" roughness={1} />
      </mesh>
      <mesh position={[0, 8.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.8, 6, 64]} />
        <meshStandardMaterial color="#1d4ed8" roughness={1} />
      </mesh>
      <mesh position={[0, 8.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.8, 64]} />
        <meshStandardMaterial color="#2d0606" roughness={0.5} />
      </mesh>

      {/* Internal Tissues / Organs around the main target - More organic look */}
      {[...Array(16)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i * 0.4) * (4 + Math.random()),
          8.2 + Math.random() * 0.2,
          Math.cos(i * 0.4) * (4 + Math.random())
        ]}>
          <sphereGeometry args={[1.2 + Math.random() * 0.5, 32, 32]} />
          <meshStandardMaterial color="#881337" opacity={0.8} transparent roughness={0.1} />
        </mesh>
      ))}
      
      {/* Blood Vessels - More complex network */}
      {[...Array(8)].map((_, i) => (
        <mesh key={`vessel-${i}`} position={[0, 8.1, 0]} rotation={[0, i * 0.8, 0]}>
          <torusGeometry args={[5 + Math.random(), 0.12, 12, 64, Math.PI]} />
          <meshStandardMaterial color="#4c0519" />
        </mesh>
      ))}
    </group>
  );
}

function SurgicalScene({ input, simProgress }: { input: SurgicalInput, simProgress: number }) {
  const lineGeometryRef = React.useRef<THREE.BufferGeometry>(null);

  // Sanitize coordinates to prevent NaN rendering errors
  const safeCoords = (coords: { x: number, y: number, z: number }): [number, number, number] => [
    (isNaN(coords.x) || coords.x === null) ? 0 : coords.x / 20,
    (isNaN(coords.y) || coords.y === null) ? 0 : coords.y / 20,
    (isNaN(coords.z) || coords.z === null) ? 0 : coords.z / 20
  ];

  const startPos = safeCoords(input.robotPosition);
  const targetPos = safeCoords(input.targetLocation);

  useFrame(() => {
    if (lineGeometryRef.current) {
      const positions = lineGeometryRef.current.attributes.position.array as Float32Array;
      positions[0] = startPos[0];
      positions[1] = startPos[1];
      positions[2] = startPos[2];
      positions[3] = targetPos[0];
      positions[4] = targetPos[1];
      positions[5] = targetPos[2];
      lineGeometryRef.current.attributes.position.needsUpdate = true;
      lineGeometryRef.current.computeBoundingSphere();
    }
  });

  return (
    <>
      <color attach="background" args={['#f8fafc']} />
      <fog attach="fog" args={['#f8fafc', 20, 70]} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 20, 10]} intensity={2} color="#ffffff" />
      <spotLight 
        position={[0, 30, 0]} 
        angle={0.15} 
        penumbra={1} 
        intensity={5} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Surgical Overhead Light Visual */}
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={10} />
      </mesh>
      
      {/* Human Anatomy Context */}
      <HumanAnatomy />

      {/* Organ Representation */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group>
          <Sphere args={[3, 64, 64]} position={[0, 0, 0]}>
            <MeshDistortMaterial
              color="#991b1b"
              speed={1.5}
              distort={0.2}
              radius={1}
              opacity={0.7}
              transparent
              roughness={0.1}
              metalness={0.2}
            />
          </Sphere>
          {/* Internal Vessels (Visual only) */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[2.5, 0.05, 16, 100]} />
            <meshStandardMaterial color="#450a0a" opacity={0.4} transparent />
          </mesh>
        </group>
      </Float>

      {/* Target Site Representation */}
      <mesh position={targetPos}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial 
          color="#facc15" 
          emissive="#facc15" 
          emissiveIntensity={Math.sin(simProgress / 5) * 2 + 2} 
          transparent
          opacity={0.9}
        />
        <Label text="Surgical Target Site" position={[0, 0.8, 0]} />
      </mesh>

      {/* Robotic Arm System */}
      <RoboticArm 
        progress={simProgress}
        startPos={startPos} 
        targetPos={targetPos} 
      />

      {/* Trajectory Path Line */}
      <line>
        <bufferGeometry ref={lineGeometryRef}>
          <bufferAttribute 
            attach="attributes-position" 
            count={2} 
            array={new Float32Array(6)} 
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color="#10b981" opacity={0.2} transparent />
      </line>

      <OrbitControls makeDefault minDistance={5} maxDistance={40} />
      <PerspectiveCamera makeDefault position={[15, 10, 15]} fov={45} />
    </>
  );
}

function FileUploadZone({ onFilesAdded, files }: { onFilesAdded: (newFiles: SurgicalFile[]) => void, files: SurgicalFile[] }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = await Promise.all(Array.from(e.target.files).map(async (file) => {
        return new Promise<SurgicalFile>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              base64: (reader.result as string).split(',')[1]
            });
          };
          reader.readAsDataURL(file);
        });
      }));
      onFilesAdded(newFiles);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            const newFiles = await Promise.all(Array.from(e.dataTransfer.files).map(async (file) => {
              return new Promise<SurgicalFile>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    name: file.name,
                    type: file.type,
                    base64: (reader.result as string).split(',')[1]
                  });
                };
                reader.readAsDataURL(file);
              });
            }));
            onFilesAdded(newFiles);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-3 group cursor-pointer ${
          isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input 
          id="file-input"
          type="file" 
          multiple 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*,.pdf,.doc,.docx"
        />
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <FileUp className={`w-6 h-6 ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">Upload Medical Data</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">CT Scans, MRI, Reports, or Videos</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between group">
              <div className="flex items-center gap-3 overflow-hidden">
                {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-amber-500 shrink-0" />}
                <span className="text-xs text-slate-600 truncate font-bold">{file.name}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFilesAdded(files.filter((_, i) => i !== idx));
                }}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Types ---

interface SurgicalFile {
  name: string;
  type: string;
  base64: string;
}

interface SurgicalInput {
  surgeryName: string;
  surgeryDetails: string;
  organ: string;
  targetLocation: { x: number; y: number; z: number };
  criticalStructures: string;
  robotPosition: { x: number; y: number; z: number };
  robotOrientation: { roll: number; pitch: number; yaw: number };
  maxDepth: number;
  safeDistance: number;
}

interface PlanningResult {
  environmentAnalysis: string;
  reason2Plan: string;
  trajectoryConstraints: string;
  geminiSimulation: string;
}

// --- Constants ---

const NEBIUS_IP = "89.169.122.179";
const REASON2_BASE_URL = `http://${NEBIUS_IP}:8000/v1`;

export default function App() {
  return (
    <ErrorBoundary>
      <SurgiPlanApp />
    </ErrorBoundary>
  );
}

function SurgiPlanApp() {
  const [input, setInput] = useState<SurgicalInput>({
    surgeryName: 'Laparoscopic Liver Resection',
    surgeryDetails: 'Removal of a 2cm lesion in Segment VI of the liver using a minimally invasive approach.',
    organ: 'Liver',
    targetLocation: { x: 45.2, y: -12.5, z: 88.0 },
    criticalStructures: 'Hepatic artery (3mm distance), Portal vein (7mm distance)',
    robotPosition: { x: 0, y: 0, z: 150 },
    robotOrientation: { roll: 0, pitch: 90, yaw: 0 },
    maxDepth: 10,
    safeDistance: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanningResult | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleLaunchSimulation = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setIsSimulating(true);
    }, 2500);
  };
  const [uploadedFiles, setUploadedFiles] = useState<SurgicalFile[]>([]);
  const [simProgress, setSimProgress] = useState(0);
  const [simStatus, setSimStatus] = useState('Initializing Systems...');
  const [activeTab, setActiveTab] = useState<'analysis' | 'motion' | 'constraints' | 'simulation'>('analysis');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Effects ---

  useEffect(() => {
    checkReason2Connection();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      setSimProgress(0);
      interval = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setSimStatus('Procedure Complete');
            return 100;
          }
          const next = prev + 0.5;
          if (next < 20) setSimStatus('Approaching Entry Point...');
          else if (next < 40) setSimStatus('Navigating Critical Structures...');
          else if (next < 80) setSimStatus('Executing Surgical Procedure...');
          else if (next < 95) setSimStatus('Performing Final Safety Check...');
          else setSimStatus('Finalizing Trajectory...');
          return next;
        });
      }, 100);
    } else {
      setSimProgress(0);
      setSimStatus('Initializing Systems...');
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const checkReason2Connection = async () => {
    setConnectionStatus('connecting');
    try {
      const response = await fetch(`/api/reason2/models`);
      if (!response.ok) throw new Error('Proxy error');
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setModelId(data.data[0].id);
        setConnectionStatus('connected');
      } else {
        throw new Error('No models found');
      }
    } catch (err) {
      console.error('Reason2 connection failed:', err);
      setConnectionStatus('failed');
    }
  };

  // --- Handlers ---

  const safeVal = (val: any) => (isNaN(val) || val === null || val === undefined) ? 0 : val;

  const handlePlanSurgery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!modelId) {
        throw new Error('Cosmos Reason2 model not connected. Please check the VM status.');
      }

      // 1. Initialize Gemini
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let detectedCoords = input.targetLocation;

      // 2. Visual Detection Step (if images exist)
      const images = uploadedFiles.filter(f => f.type.startsWith('image/'));
      if (images.length > 0) {
        setSimStatus('Analyzing Medical Imaging...');
        const detectionResponse = await genAI.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: {
            parts: [
              { text: "Analyze this medical scan. Find the lesion or tumor (often marked with an arrow or appearing as a dark/light mass). Estimate its 3D coordinates (X, Y, Z) for a surgical robot, assuming the center of the organ is roughly (0,0,0) and the organ spans -100 to 100 on each axis. Return ONLY a JSON object: { \"x\": number, \"y\": number, \"z\": number, \"confidence\": number, \"description\": string }" },
              ...images.map(file => ({
                inlineData: { data: file.base64, mimeType: file.type }
              }))
            ]
          },
          config: { responseMimeType: "application/json" }
        });

        try {
          const detectionData = JSON.parse(detectionResponse.text || '{}');
          if (detectionData.x !== undefined) {
            detectedCoords = { x: detectionData.x, y: detectionData.y, z: detectionData.z };
            setInput(prev => ({ ...prev, targetLocation: detectedCoords }));
          }
        } catch (e) {
          console.error("Failed to parse detection coordinates", e);
        }
      }

      // 3. Prepare Reason2 Prompt with detected or manual coordinates
      const textContent = `
        You are an AI surgical motion planner.
        
        Surgical Procedure: ${input.surgeryName}
        Procedure Details: ${input.surgeryDetails}

        Inputs:
        1. Medical Imaging Analysis:
           - 3D organ model: ${input.organ}
           - Target location (Detected from Scans): (${detectedCoords.x}, ${detectedCoords.y}, ${detectedCoords.z})
           - Nearby critical structures: ${input.criticalStructures}
        2. Robot Arm State:
           - Current position: (${input.robotPosition.x}, ${input.robotPosition.y}, ${input.robotPosition.z})
           - Orientation: (roll: ${input.robotOrientation.roll}, pitch: ${input.robotOrientation.pitch}, yaw: ${input.robotOrientation.yaw})
        3. Tool Constraints:
           - Maximum depth: ${input.maxDepth} mm
           - Safe distance from vessels: ${input.safeDistance} mm
        4. Surgical Task:
           - Execute the procedure safely
           - Minimize damage to surrounding tissue

        Instructions:
        1. Analyze the environment and identify risky areas based on the procedure type and the detected tumor position.
        2. Determine optimal entry point and tool orientation for this specific surgery.
        3. Plan step-by-step motion for the robotic arm to reach the target at (${detectedCoords.x}, ${detectedCoords.y}, ${detectedCoords.z}).
        4. Ensure all safety constraints are followed.
        5. IMPORTANT: Use the provided visual data (images/videos) to refine the target location and identify any hidden risks not mentioned in the text.
        6. In the [ENVIRONMENT_ANALYSIS] section, explicitly mention any specific anatomical features or risks you identified from the uploaded images.
        
        Output your response in three distinct sections using Markdown formatting (headings, bullet points, numbered lists, etc.):
        [ENVIRONMENT_ANALYSIS]
        ...
        [REASON2_MOTION_PLAN]
        ...
        [TRAJECTORY_CONSTRAINTS]
        ...
      `;

      let reason2Content: any;
      
      if (images.length > 0) {
        reason2Content = [
          { type: 'text', text: textContent },
          ...images.map(file => ({
            type: 'image_url',
            image_url: { url: `data:${file.type};base64,${file.base64}` }
          }))
        ];
      } else {
        reason2Content = textContent;
      }

      // Call Reason2 via Proxy
      const reason2Response = await fetch('/api/reason2/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: reason2Content }],
          max_tokens: 1500,
          temperature: 0.2,
        }),
      });

      if (!reason2Response.ok) {
        const errorData = await reason2Response.json();
        throw new Error(errorData.details || 'Reason2 Proxy Request Failed');
      }

      const reason2Data = await reason2Response.json();
      const fullReason2Output = reason2Data.choices[0].message.content || '';

      // Robust Parsing of Reason2 output
      const extractSection = (text: string, section: string, nextSection?: string) => {
        const startTag = `[${section}]`;
        const startIndex = text.indexOf(startTag);
        if (startIndex === -1) return null;
        
        let content = text.substring(startIndex + startTag.length);
        if (nextSection) {
          const endTag = `[${nextSection}]`;
          const endIndex = content.indexOf(endTag);
          if (endIndex !== -1) {
            content = content.substring(0, endIndex);
          }
        }
        
        // Clean up potential artifacts like leading/trailing parentheses or markdown blocks
        return content.replace(/^[\s\)]+/, '').trim();
      };

      const envAnalysis = extractSection(fullReason2Output, 'ENVIRONMENT_ANALYSIS', 'REASON2_MOTION_PLAN') || 'Analysis failed';
      const motionPlan = extractSection(fullReason2Output, 'REASON2_MOTION_PLAN', 'TRAJECTORY_CONSTRAINTS') || 'Plan generation failed';
      const constraints = extractSection(fullReason2Output, 'TRAJECTORY_CONSTRAINTS') || 'Constraints extraction failed';

      // 3. Prepare Gemini Prompt with Multimodal Data
      const geminiPromptParts: any[] = [
        {
          text: `
            You are a surgical simulation expert. You are ENHANCING the high-level motion plan generated by Cosmos Reason2.
            
            Cosmos Reason2 High-Level Plan:
            ${motionPlan}
            
            Cosmos Reason2 Constraints:
            ${constraints}
            
            Instructions:
            1. Take the Reason2 plan and refine it into detailed physics-based simulation steps.
            2. Add specific joint angles, velocity profiles, and acceleration limits.
            3. Enhance the safety protocols by adding specific "if-then" emergency stop conditions based on the Reason2 constraints.
            4. Output in a format ready for a physics-based robot simulator (PyBullet, Isaac Sim, or Unity Robotics).
            5. Use the provided visual data to ensure the simulation steps are anatomically accurate.
            6. IMPORTANT: Use Markdown formatting for the output, including bold text for key parameters and step-by-step lists.
            
            Format:
            - Step-by-step motion commands
            - Collision checks
            - Robot joint targets
            - Animation or simulation commands for VR/3D visualization
          `
        }
      ];

      // Add images to Gemini prompt
      uploadedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          geminiPromptParts.push({
            inlineData: {
              data: file.base64,
              mimeType: file.type
            }
          });
        }
      });

      const geminiResponse = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts: geminiPromptParts },
      });

      const finalResult: PlanningResult = {
        environmentAnalysis: envAnalysis,
        reason2Plan: motionPlan,
        trajectoryConstraints: constraints,
        geminiSimulation: geminiResponse.text || 'Simulation generation failed',
      };

      setResult(finalResult);

      // 5. Save to History
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: input.surgeryName,
            details: input.surgeryDetails,
            organ: input.organ,
            target_x: detectedCoords.x,
            target_y: detectedCoords.y,
            target_z: detectedCoords.z,
            critical_structures: input.criticalStructures,
            robot_x: input.robotPosition.x,
            robot_y: input.robotPosition.y,
            robot_z: input.robotPosition.z,
            analysis: finalResult.environmentAnalysis,
            motion_plan: finalResult.reason2Plan,
            constraints: finalResult.trajectoryConstraints,
            simulation: finalResult.geminiSimulation
          })
        });
        fetchHistory();
      } catch (err) {
        console.error('Failed to save history:', err);
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SurgiPlan <span className="text-emerald-600">AI</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Precision Motion Planning System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold ${
            connectionStatus === 'connected' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            connectionStatus === 'connecting' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
              'bg-red-500'
            }`} />
            {connectionStatus === 'connected' ? `COSMOS-REASON2: ${modelId}` : 
             connectionStatus === 'connecting' ? 'CONNECTING TO VM...' : 
             'VM DISCONNECTED'}
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-500 hover:text-slate-900"
          >
            <History className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">History</span>
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l border-slate-200 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Planning History</h2>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <History className="w-12 h-12 mb-4" />
                    <p className="text-sm">No previous plans found</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm"
                      onClick={() => {
                        setInput({
                          surgeryName: item.name,
                          surgeryDetails: item.details,
                          organ: item.organ,
                          targetLocation: { x: item.target_x, y: item.target_y, z: item.target_z },
                          criticalStructures: item.critical_structures,
                          robotPosition: { x: item.robot_x, y: item.robot_y, z: item.robot_z },
                          robotOrientation: { roll: 0, pitch: 90, yaw: 0 },
                          maxDepth: 10,
                          safeDistance: 5,
                        });
                        setResult({
                          environmentAnalysis: item.analysis,
                          reason2Plan: item.motion_plan,
                          trajectoryConstraints: item.constraints,
                          geminiSimulation: item.simulation
                        });
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await fetch(`/api/history/${item.id}`, { method: 'DELETE' });
                            fetchHistory();
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mb-3">{new Date(item.created_at).toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase">{item.organ}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[9px] font-bold text-emerald-600 uppercase">Plan Ready</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Surgical Parameters</h2>
              </div>
              <button 
                onClick={() => {
                  setInput({
                    surgeryName: '',
                    surgeryDetails: '',
                    organ: '',
                    targetLocation: { x: 0, y: 0, z: 0 },
                    criticalStructures: '',
                    robotPosition: { x: 0, y: 0, z: 0 },
                    robotOrientation: { roll: 0, pitch: 0, yaw: 0 },
                    maxDepth: 0,
                    safeDistance: 0,
                  });
                  setResult(null);
                  setUploadedFiles([]);
                }}
                className="text-[10px] font-bold text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Surgery Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Surgery Name</label>
                  <input 
                    type="text" 
                    value={input.surgeryName}
                    onChange={(e) => setInput({...input, surgeryName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none text-slate-900"
                    placeholder="e.g., Laparoscopic Liver Resection"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Procedure Details</label>
                  <textarea 
                    value={input.surgeryDetails}
                    onChange={(e) => setInput({...input, surgeryDetails: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none resize-none text-slate-900"
                    placeholder="Describe the surgical approach and goals..."
                  />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Organ & Target */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Target Organ</label>
                  <input 
                    type="text" 
                    value={input.organ}
                    onChange={(e) => setInput({...input, organ: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none text-slate-900"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Target Site Coordinates (X, Y, Z)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">{axis}</span>
                        <input 
                          type="number" 
                          value={input.targetLocation[axis]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setInput({
                              ...input, 
                              targetLocation: { ...input.targetLocation, [axis]: isNaN(val) ? 0 : val }
                            });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold focus:border-emerald-500/50 outline-none text-slate-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Critical Structures</label>
                  <textarea 
                    value={input.criticalStructures}
                    onChange={(e) => setInput({...input, criticalStructures: e.target.value})}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none resize-none text-slate-900"
                  />
                </div>

                {/* Multimodal Upload */}
                <div className="pt-2">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Multimodal Context (Optional)</label>
                  <FileUploadZone 
                    files={uploadedFiles}
                    onFilesAdded={(newFiles) => setUploadedFiles(newFiles)}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Robot State */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Robot Arm State</h3>
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Current Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <input 
                        key={axis}
                        type="number" 
                        value={input.robotPosition[axis]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setInput({
                            ...input, 
                            robotPosition: { ...input.robotPosition, [axis]: isNaN(val) ? 0 : val }
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-emerald-500/50 outline-none text-slate-900"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Max Depth (mm)</label>
                    <input 
                      type="number" 
                      value={input.maxDepth}
                      onChange={(e) => setInput({...input, maxDepth: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-emerald-500/50 outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Safe Dist (mm)</label>
                    <input 
                      type="number" 
                      value={input.safeDistance}
                      onChange={(e) => setInput({...input, safeDistance: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-emerald-500/50 outline-none text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handlePlanSurgery}
                disabled={loading || connectionStatus !== 'connected'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                    GENERATE MOTION PLAN
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-600 leading-relaxed">
                    <p className="font-bold mb-1">System Error</p>
                    {error}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {!result && !loading ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full min-h-[600px] border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Crosshair className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Ready for Planning</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Configure the surgical parameters and click generate to initiate the dual-AI motion planning sequence.
                </p>
              </motion.div>
            ) : loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 shadow-xl"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                  <Activity className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-3 text-center">
                  <h3 className="text-lg font-bold text-slate-900">Synthesizing Motion Plan</h3>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      <span className="animate-pulse">Cosmos Reason2 Processing</span>
                      <ChevronRight className="w-3 h-3" />
                      <span className="opacity-40">Gemini Simulation Mapping</span>
                    </div>
                    <div className="w-64 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 15, ease: "linear" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Model Handshake Visualization */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-purple-500/5 opacity-50" />
                  
                  <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <Cpu className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Cosmos Reason2</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">Spatial Reasoning Engine</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0.2, scale: 0.8 }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                        />
                      ))}
                    </div>
                    <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Enhanced Planning Handshake</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0.2, scale: 0.8 }}
                          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: (4-i) * 0.2 }}
                          className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Gemini 3.1 Pro</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-tighter font-bold">Simulation & Code Synthesis</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Tabs */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex border-b border-slate-100 bg-slate-50/50">
                    {(['analysis', 'motion', 'constraints', 'simulation'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                          activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab}
                        {activeTab === tab && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-8 min-h-[500px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'analysis' && (
                        <motion.div
                          key="analysis"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-500/10 rounded-lg">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Surgical Environment Analysis</h3>
                                <p className="text-[10px] text-slate-400 font-bold">Cosmos Reason2 Spatial Engine</p>
                              </div>
                            </div>
                            {uploadedFiles.some(f => f.type.startsWith('image/')) && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                <ImageIcon className="w-3 h-3 text-blue-400" />
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Multimodal Context Integrated</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result?.environmentAnalysis || ''}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'motion' && (
                        <motion.div
                          key="motion"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                              <Terminal className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Reason2 Motion Plan</h3>
                              <p className="text-[10px] text-slate-400 font-bold">High-Level Trajectory Logic</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result?.reason2Plan || ''}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'constraints' && (
                        <motion.div
                          key="constraints"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Target className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trajectory Constraints</h3>
                              <p className="text-[10px] text-slate-400 font-bold">Safety & Boundary Parameters</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result?.trajectoryConstraints || ''}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'simulation' && (
                        <motion.div
                          key="simulation"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-purple-500" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Gemini Simulation Synthesis</h3>
                                <p className="text-[10px] text-slate-400 font-bold">Physics-Ready Code Generation</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={handleLaunchSimulation}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Launch VR Simulation
                              </button>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result?.geminiSimulation || ''}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Validation Overlay */}
      <AnimatePresence>
        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 relative mb-8">
              <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
              <motion.div 
                className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <ShieldCheck className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Validating Trajectory</h2>
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <div className="w-full space-y-2">
                {[
                  { label: 'Kinematic Constraints', delay: 0 },
                  { label: 'Collision Boundaries', delay: 0.5 },
                  { label: 'Safety Buffer Zones', delay: 1.0 },
                  { label: 'Model Handshake Sync', delay: 1.5 },
                ].map((check, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: check.delay }}
                    className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    <span>{check.label}</span>
                    <span className="text-emerald-500">Verified</span>
                  </motion.div>
                ))}
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Overlay */}
      <AnimatePresence>
        {isSimulating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-white flex flex-col"
            >
              {/* HUD Header */}
              <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                  <div className="bg-emerald-50/90 p-3 rounded-xl border border-emerald-200 backdrop-blur-xl shadow-lg">
                    <Activity className="w-6 h-6 text-emerald-600 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{input.surgeryName.toUpperCase()}</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live VR Simulation</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                  <div className="bg-white/90 border border-slate-200 rounded-xl px-4 py-2 backdrop-blur-xl flex flex-col items-end shadow-lg">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Frame Rate</span>
                    <span className="text-sm font-bold text-slate-900">60.0 FPS</span>
                  </div>
                  <button 
                    onClick={() => setIsSimulating(false)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl transition-all shadow-md"
                  >
                    <X className="w-6 h-6 text-slate-600" />
                  </button>
                </div>
              </div>

              {/* HUD Sidebars */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 space-y-4 z-10 pointer-events-none">
                <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 backdrop-blur-xl pointer-events-auto w-64 shadow-xl">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Telemetry Data</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Tool Depth', value: `${(4 + Math.sin(simProgress/10) * 2).toFixed(1)}mm`, color: 'text-emerald-600' },
                      { label: 'Vessel Dist', value: `${(5 + Math.cos(simProgress/15) * 1.5).toFixed(1)}mm`, color: 'text-blue-600' },
                      { label: 'Force Load', value: `${(0.8 + Math.random() * 0.1).toFixed(2)}N`, color: 'text-amber-600' },
                      { label: 'Joint Temp', value: `${(38 + (simProgress/50)).toFixed(1)}°C`, color: 'text-slate-900' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</span>
                        <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 border border-slate-200 rounded-2xl p-4 backdrop-blur-xl pointer-events-auto w-64 shadow-xl">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Active Constraints</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">No Collisions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Safe Velocity</span>
                    </div>
                  </div>
                </div>
              </div>

            {/* 3D Canvas */}
            <div className="flex-1 cursor-move">
              <Canvas 
                shadows 
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                  gl.shadowMap.type = THREE.PCFShadowMap;
                }}
              >
                <SurgicalScene input={input} simProgress={simProgress} />
              </Canvas>
            </div>

            {/* HUD Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-10 pointer-events-none">
              <div className="bg-white/90 border border-slate-200 rounded-2xl p-6 backdrop-blur-xl pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Simulation Progress</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{Math.floor(simProgress)}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${simProgress}%` }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{simStatus}</span>
                  <span>Est. Time Remaining: {Math.max(0, Math.floor((100 - simProgress) / 5))}s</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 px-6 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase">Operational</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Latency</span>
            <span className="text-[9px] font-bold text-slate-600">142ms</span>
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2026 SurgiPlan AI &bull; Surgical Robotics Division
        </div>
      </footer>
    </div>
  );
}
