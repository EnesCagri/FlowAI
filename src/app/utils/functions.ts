import { Node, Edge } from "@xyflow/react";
import { CustomNode, MathOperation } from "../types";
import { processImage } from "./imageProcessing";

export const calculateMathOperation = (
  node: CustomNode,
  nodes: CustomNode[],
  edges: Edge[]
) => {
  const inputEdges = edges.filter((edge) => edge.target === node.id);
  const isSingleInputOperation = [
    "kare",
    "karekök",
    "mutlak",
    "faktöriyel",
    "yazdır",
  ].includes(node.data.type as MathOperation);

  if (isSingleInputOperation) {
    const input1 = inputEdges[0];
    if (!input1) return null;

    const inputNode1 = nodes.find((n) => n.id === input1.source);
    if (!inputNode1) return null;

    const value1 = inputNode1.data.value || inputNode1.data.result;
    if (value1 === undefined) return null;

    switch (node.data.type) {
      case "kare":
        return Math.pow(Number(value1), 2);
      case "karekök":
        return Math.sqrt(Number(value1));
      case "mutlak":
        return Math.abs(Number(value1));
      case "faktöriyel":
        let result = 1;
        for (let i = 2; i <= Number(value1); i++) {
          result *= i;
        }
        return result;
      case "yazdır":
        return value1;
      default:
        return null;
    }
  } else {
    if (inputEdges.length !== 2) return null;

    const input1 = inputEdges.find((edge) => edge.targetHandle === "input1");
    const input2 = inputEdges.find((edge) => edge.targetHandle === "input2");

    if (!input1 || !input2) return null;

    const inputNode1 = nodes.find((n) => n.id === input1.source);
    const inputNode2 = nodes.find((n) => n.id === input2.source);

    if (!inputNode1 || !inputNode2) return null;

    const value1 = inputNode1.data.value || inputNode1.data.result;
    const value2 = inputNode2.data.value || inputNode2.data.result;

    if (value1 === undefined || value2 === undefined) return null;

    switch (node.data.type) {
      case "topla":
        return Number(value1) + Number(value2);
      case "çıkar":
        return Number(value1) - Number(value2);
      case "çarp":
        return Number(value1) * Number(value2);
      case "böl":
        if (Number(value2) === 0) return null;
        return Number(value1) / Number(value2);
      case "üs":
        return Math.pow(Number(value1), Number(value2));
      case "mod":
        return Number(value1) % Number(value2);
      default:
        return null;
    }
  }
};

export const processNode = (
  node: CustomNode,
  nodes: CustomNode[],
  edges: Edge[],
  processedNodes: Set<string>
): { result: any; output: string[] } => {
  // If the node has already been processed and has a result, return it
  if (
    node.data.processed &&
    (node.data.result !== undefined || node.data.imageData)
  ) {
    console.log("Node already processed:", node.id, node.data.type);
    return {
      result: node.data.result || node.data.imageData,
      output: [node.data.output || ""],
    };
  }

  console.log("Processing node:", node.id, node.data.type);
  processedNodes.add(node.id);
  let result = null;
  let output: string[] = [];

  switch (node.data.type) {
    case "değişken":
      result = node.data.value;
      output.push(`Değer: ${result || "undefined"}`);
      break;

    case "yazdır":
      const printEdge = edges.find((edge) => edge.target === node.id);
      if (printEdge) {
        const inputNode = nodes.find((n) => n.id === printEdge.source);
        if (inputNode) {
          const { result: inputResult } = processNode(
            inputNode,
            nodes,
            edges,
            processedNodes
          );
          result = inputResult;
          output.push(
            `Çıktı: ${inputResult !== undefined ? inputResult : "undefined"}`
          );
        }
      }
      break;

    case "gri":
    case "parlaklik":
    case "kontrast":
    case "bulanik":
      const inputEdge = edges.find((edge) => edge.target === node.id);
      if (inputEdge) {
        const inputNode = nodes.find((n) => n.id === inputEdge.source);
        if (inputNode?.data.imageData) {
          const { width, height, data: pixelData } = inputNode.data.imageData;

          let intensity: number | undefined;
          if (["parlaklik", "kontrast", "bulanik"].includes(node.data.type)) {
            const intensityEdge = edges.find(
              (edge) =>
                edge.target === node.id && edge.targetHandle === "intensity"
            );
            if (intensityEdge) {
              const intensityNode = nodes.find(
                (n) => n.id === intensityEdge.source
              );
              if (intensityNode) {
                const { result: intensityResult } = processNode(
                  intensityNode,
                  nodes,
                  edges,
                  processedNodes
                );
                intensity = Number(intensityResult || 0);
              }
            }
          }

          const processedImage = processImage(
            pixelData,
            width,
            height,
            node.data.type,
            intensity
          );
          if (processedImage) {
            result = processedImage;
            output.push(`İşlem: ${node.data.type}`);
            if (intensity !== undefined) {
              output.push(`Yoğunluk: ${intensity}`);
            }
          }
        }
      }
      break;

    default:
      if (
        [
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
        ].includes(node.data.type)
      ) {
        result = calculateMathOperation(node, nodes, edges);
        if (result !== null) {
          output.push(`Sonuç: ${result}`);
        }
      }
      break;
  }

  // Mark the node as processed and store the result
  node.data.processed = true;
  if (result !== null) {
    if (["gri", "parlaklik", "kontrast", "bulanik"].includes(node.data.type)) {
      node.data.imageData = result;
      node.data.result = undefined; // Clear any previous numeric result
    } else {
      node.data.result = result;
      node.data.imageData = undefined; // Clear any previous image data
    }
  }

  // Store the output in the node's data for display in the block
  node.data.output = output.join("\n");

  return { result, output };
};
