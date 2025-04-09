import { Node, Edge, Position } from "@xyflow/react";

export type MathOperation =
  | "topla"
  | "çıkar"
  | "çarp"
  | "böl"
  | "kare"
  | "karekök"
  | "mutlak"
  | "üs"
  | "mod"
  | "faktöriyel"
  | "yazdır"
  | "dosyaoku"
  | "resimoku"
  | "gri"
  | "parlaklik"
  | "kontrast"
  | "bulanik"
  | "değişken";

export interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface NodeData {
  [key: string]: unknown;
  type?: MathOperation;
  value?: number;
  imageData?: ImageData;
  originalImage?: string;
  processed?: boolean;
  id: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  fileContent?: string;
  label?: string;
  output?: string;
  result?: number;
  width?: number;
  height?: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  dragHandle?: string;
  parentId?: string;
}

export interface EdgeData {
  [key: string]: unknown;
  type?: string;
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge<EdgeData>;

export const mathOperations = [
  "topla",
  "çıkar",
  "çarp",
  "böl",
  "kare",
  "karekök",
  "mutlak",
  "üs",
  "mod",
  "faktöriyel",
  "yazdır",
  "dosyaoku",
  "resimoku",
  "gri",
  "parlaklik",
  "kontrast",
  "bulanik",
  "değişken",
] as const;

export type CustomNodeData = NodeData;

export interface DragData {
  type: MathOperation;
  label: string;
}
