import { Node, Edge } from "@xyflow/react";

export type ComparisonOperator = "==" | "!=" | ">" | "<" | ">=" | "<=";
export type LogicalOperator = "AND" | "OR";

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
  | "kenar"
  | "değişken"
  | "if";

export type EdgeDetectionAlgorithm = "sobel" | "prewitt" | "roberts";

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  originalImage?: string;
}

export interface Condition {
  id: string;
  operator: ComparisonOperator;
  leftNodeId?: string;
  rightNodeId?: string;
}

export interface ConditionGroup {
  conditions: Condition[];
  operators: LogicalOperator[];
}

export interface NodeData {
  type?: MathOperation;
  value?: string;
  result?: number;
  fileContent?: string;
  imageData?: ImageData;
  originalImage?: string;
  algorithm?: EdgeDetectionAlgorithm;
  conditionGroup?: ConditionGroup;
  processed?: boolean;
  [key: string]: unknown;
}

export interface EdgeData extends Record<string, unknown> {
  type?: string;
}

export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge<EdgeData>;

export interface CustomNodeData {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface DragData {
  type: MathOperation;
  label: string;
}
