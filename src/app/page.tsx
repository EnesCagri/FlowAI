"use client";

import { useCallback, useState } from "react";
import {
  Node,
  Edge,
  Controls,
  Background,
  addEdge,
  Connection,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeChange,
  EdgeChange,
  ReactFlow,
  XYPosition,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Sidebar from "./components/Sidebar";
import { BlockNode } from "./components/BlockNode";
import Console from "./components/Console";
import { useStore } from "./store/useFlowStore";
import type { FlowState } from "./store/useFlowStore";
import { CustomNode, MathOperation, DragData } from "./types";
import { motion } from "framer-motion";
import { processImage } from "./utils/imageProcessing";
import { processNode } from "./utils/functions";

const nodeTypes = {
  block: BlockNode,
};

const mathOperations = [
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
] as const;

export default function FlowEditor() {
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const { nodes, edges, setNodes, setEdges, updateNode } = useStore();
  const [processedNodes] = useState<Set<string>>(new Set());

  console.log("FlowEditor rendered", {
    nodesCount: nodes.length,
    edgesCount: edges.length,
  });

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds: Node[]) => {
        return changes.reduce((acc: Node[], change) => {
          if (change.type === "remove") {
            return acc.filter((node) => node.id !== change.id);
          }
          if (change.type === "position" && change.position) {
            return acc.map((node) => {
              if (node.id === change.id) {
                return { ...node, position: change.position as XYPosition };
              }
              return node;
            });
          }
          return acc;
        }, nds);
      });
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds: Edge[]) => {
        return changes.reduce((acc: Edge[], change) => {
          if (change.type === "remove") {
            return acc.filter((edge) => edge.id !== change.id);
          }
          return acc;
        }, eds);
      });
    },
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const data = JSON.parse(
        event.dataTransfer.getData("application/reactflow")
      ) as DragData;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: CustomNode = {
        id: `${data.type}-${Date.now()}`,
        type: "block",
        position,
        data: {
          label: data.label,
          type: data.type,
        },
      };

      setNodes((nds: CustomNode[]) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const getNodeValue = useCallback(
    (nodeId: string): number | undefined => {
      const node = nodes.find((n) => n.id === nodeId) as CustomNode | undefined;
      if (!node) return undefined;

      if (node.data.type === "değişken") {
        return parseFloat(node.data.value || "0");
      }

      if (mathOperations.includes(node.data.type as MathOperation)) {
        return node.data.result;
      }

      return undefined;
    },
    [nodes]
  );

  const calculateMathOperation = (
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

      const value1 = inputNode1.data.value;
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
          console.log(`Yazdır: ${value1}`);
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

      const value1 = inputNode1.data.value;
      const value2 = inputNode2.data.value;

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

  const handleClearCanvas = useCallback(() => {
    console.log("Clearing canvas");
    setNodes([]);
    setEdges([]);
    setOutput([]);
    processedNodes.clear();
  }, [setNodes, setEdges, processedNodes]);

  const handleClearOutput = useCallback(() => {
    console.log("Clearing output");
    setOutput([]);
  }, []);

  const handleRun = useCallback(() => {
    console.log("Starting run operation");
    // Clear previous output and processed nodes
    setOutput([]);
    processedNodes.clear();

    // Reset all processed flags
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, processed: false },
      }))
    );

    // Find the start nodes (nodes with no incoming edges)
    const startNodes = nodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    console.log("Found start nodes:", startNodes.length);

    // Process each start node
    startNodes.forEach((startNode) => {
      console.log("Processing node:", startNode.id, startNode.data.type);
      const { result, output: nodeOutput } = processNode(
        startNode as CustomNode,
        nodes as CustomNode[],
        edges,
        processedNodes
      );

      if (result !== null) {
        console.log("Updating node result:", startNode.id, result);
        updateNode(startNode.id, { result });
      }

      setOutput((prev) => [...prev, ...nodeOutput]);
    });
  }, [nodes, edges, updateNode, processedNodes, setNodes]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-white/[0.2] bg-[size:20px_20px]" />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-full"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDragOver={onDragOver}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              fitView
              className="bg-transparent"
            >
              <Background color="#ffffff20" />
            </ReactFlow>
          </motion.div>
        </div>
      </div>
      <div className="flex items-center justify-center w-full p-6 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800">
        <Console
          output={output}
          onClear={handleClearOutput}
          onClearCanvas={handleClearCanvas}
          onRun={handleRun}
        />
      </div>
    </div>
  );
}
