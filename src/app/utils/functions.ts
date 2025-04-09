import { Node, Edge } from "@xyflow/react";
import { CustomNode, MathOperation } from "../types";
import { processImage } from "./imageProcessing";

export const calculateMathOperation = (
  node: CustomNode,
  nodes: CustomNode[],
  edges: Edge[]
) => {
  console.log("Calculating math operation for node:", node.id, node.data.type);
  const inputEdges = edges.filter((edge) => edge.target === node.id);
  console.log("Input edges:", inputEdges);

  const isSingleInputOperation = [
    "kare",
    "karekök",
    "mutlak",
    "faktöriyel",
    "yazdır",
  ].includes(node.data.type as MathOperation);

  if (isSingleInputOperation) {
    const input1 = inputEdges[0];
    if (!input1) {
      console.log("No input edge found for single input operation");
      return null;
    }

    const inputNode1 = nodes.find((n) => n.id === input1.source);
    if (!inputNode1) {
      console.log("Input node not found");
      return null;
    }

    const value1 = inputNode1.data.value || inputNode1.data.result;
    console.log("Input value:", value1);
    if (value1 === undefined) {
      console.log("Input value is undefined");
      return null;
    }

    let result;
    switch (node.data.type) {
      case "kare":
        result = Math.pow(Number(value1), 2);
        break;
      case "karekök":
        result = Math.sqrt(Number(value1));
        break;
      case "mutlak":
        result = Math.abs(Number(value1));
        break;
      case "faktöriyel":
        result = 1;
        for (let i = 2; i <= Number(value1); i++) {
          result *= i;
        }
        break;
      case "yazdır":
        result = value1;
        break;
      default:
        result = null;
    }
    console.log("Calculated result for single input:", result);
    return result;
  } else {
    if (inputEdges.length !== 2) {
      console.log("Expected 2 input edges, got:", inputEdges.length);
      return null;
    }

    const input1 = inputEdges.find((edge) => edge.targetHandle === "input1");
    const input2 = inputEdges.find((edge) => edge.targetHandle === "input2");

    if (!input1 || !input2) {
      console.log("Missing input edges:", { input1, input2 });
      return null;
    }

    const inputNode1 = nodes.find((n) => n.id === input1.source);
    const inputNode2 = nodes.find((n) => n.id === input2.source);

    if (!inputNode1 || !inputNode2) {
      console.log("Input nodes not found:", { inputNode1, inputNode2 });
      return null;
    }

    const value1 = inputNode1.data.value || inputNode1.data.result;
    const value2 = inputNode2.data.value || inputNode2.data.result;
    console.log("Input values:", { value1, value2 });

    if (value1 === undefined || value2 === undefined) {
      console.log("Input values undefined");
      return null;
    }

    let result;
    switch (node.data.type) {
      case "topla":
        result = Number(value1) + Number(value2);
        console.log(result);
        break;
      case "çıkar":
        result = Number(value1) - Number(value2);
        console.log(result);
        break;
      case "çarp":
        result = Number(value1) * Number(value2);
        console.log(result);
        break;
      case "böl":
        if (Number(value2) === 0) {
          console.log("Division by zero!");
          return null;
        }
        result = Number(value1) / Number(value2);
        break;
      case "üs":
        result = Math.pow(Number(value1), Number(value2));
        break;
      case "mod":
        result = Number(value1) % Number(value2);
        break;
      default:
        result = null;
    }
    console.log("Calculated result for double input:", result);
    return result;
  }
};

export const processNode = (
  node: CustomNode,
  nodes: CustomNode[],
  edges: Edge[],
  processedNodes: Set<string>
): { result: any; output: string[] } => {
  console.log("Processing node:", { id: node.id, type: node.data.type });

  if (
    node.data.processed &&
    (node.data.result !== undefined || node.data.imageData)
  ) {
    console.log("Node already processed:", {
      id: node.id,
      result: node.data.result,
    });
    return {
      result: node.data.result || node.data.imageData,
      output: [node.data.output || ""],
    };
  }

  processedNodes.add(node.id);
  let result = null;
  let output: string[] = [];

  switch (node.data.type) {
    case "değişken":
      result = node.data.value;
      console.log("Variable node value:", result);
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
          console.log("Print node result:", result);
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
            Array.from(pixelData),
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
        ].includes(node.data.type || "")
      ) {
        result = calculateMathOperation(node, nodes, edges);
        console.log("Math operation result:", { type: node.data.type, result });
        if (result !== null) {
          output.push(`Sonuç: ${result}`);
        }
      }
      break;
  }

  // Mark the node as processed and store the result
  node.data.processed = true;
  if (result !== null) {
    node.data.result = result;
    console.log("Updated node data:", { id: node.id, result });
  }

  node.data.output = output.join("\n");
  return { result, output };
};
