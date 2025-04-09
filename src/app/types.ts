import { Node } from "@xyflow/react";

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
] as const;

export type MathOperation = (typeof mathOperations)[number];

export interface NodeData {
  label: string;
  type:
    | MathOperation
    | "değişken"
    | "yazdır"
    | "dosyaoku"
    | "resimoku"
    | "gri"
    | "parlaklik"
    | "kontrast"
    | "bulanik";
  value?: string | number;
  result?: number;
  fileContent?: string;
  imageData?: {
    width: number;
    height: number;
    data: number[];
    originalImage?: string;
  };
  intensity?: number;
  processed?: boolean;
  output?: string;
}

export interface CustomNodeData extends Node<NodeData> {
  type: "block";
}

export type CustomNode = Node<NodeData>;

export interface DragData {
  type: "değişken" | MathOperation;
  label: string;
}
