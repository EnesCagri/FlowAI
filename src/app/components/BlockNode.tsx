import { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps, useNodes, useEdges } from "@xyflow/react";
import { useStore } from "../store/useFlowStore";
import { motion } from "framer-motion";
import { X, Plus, Upload, Image as ImageIcon } from "lucide-react";
import {
  NodeData,
  MathOperation,
  EdgeData,
  CustomNode,
  CustomEdge,
  EdgeDetectionAlgorithm,
  ComparisonOperator,
  LogicalOperator,
  Condition,
} from "../types";
import { processImage } from "../utils/imageProcessing";
import { calculateMathOperation } from "../utils/functions";
import Image from "next/image";

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
  "dosyaoku",
  "resimoku",
  "gri",
  "parlaklik",
  "kontrast",
  "bulanik",
  "kenar",
  "if",
] as const;

const getNodeColor = (type: string) => {
  switch (type) {
    case "değişken":
      return "bg-violet-100 border-violet-300 hover:border-violet-400";
    case "topla":
      return "bg-blue-100 border-blue-300 hover:border-blue-400";
    case "çıkar":
      return "bg-red-100 border-red-300 hover:border-red-400";
    case "çarp":
      return "bg-amber-100 border-amber-300 hover:border-amber-400";
    case "böl":
      return "bg-cyan-100 border-cyan-300 hover:border-cyan-400";
    case "kare":
      return "bg-purple-100 border-purple-300 hover:border-purple-400";
    case "karekök":
      return "bg-green-100 border-green-300 hover:border-green-400";
    case "mutlak":
      return "bg-pink-100 border-pink-300 hover:border-pink-400";
    case "üs":
      return "bg-orange-100 border-orange-300 hover:border-orange-400";
    case "mod":
      return "bg-teal-100 border-teal-300 hover:border-teal-400";
    case "faktöriyel":
      return "bg-indigo-100 border-indigo-300 hover:border-indigo-400";
    case "yazdır":
      return "bg-emerald-100 border-emerald-300 hover:border-emerald-400";
    case "dosyaoku":
      return "bg-rose-100 border-rose-300 hover:border-rose-400";
    case "resimoku":
    case "gri":
    case "parlaklik":
    case "kontrast":
    case "bulanik":
      return "bg-purple-100 border-purple-300 hover:border-purple-400";
    case "if":
      return "bg-yellow-100 border-yellow-300 hover:border-yellow-400";
    default:
      return "bg-gray-100 border-gray-300 hover:border-gray-400";
  }
};

const isMathOperation = (type: MathOperation | undefined): boolean => {
  return (
    type !== undefined &&
    type !== "değişken" &&
    mathOperations.includes(type as any)
  );
};

const isVariable = (type: MathOperation | undefined): boolean => {
  return type === "değişken";
};

const ConditionEditor = ({
  condition,
  onUpdate,
  onDelete,
}: {
  condition: Condition;
  onUpdate: (id: string, updates: Partial<Condition>) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
    <Handle
      type="target"
      position={Position.Left}
      id={`left-${condition.id}`}
      className="w-3 h-3 !bg-yellow-400 hover:!bg-yellow-500 transition-colors"
    />
    <select
      value={condition.operator}
      onChange={(e) =>
        onUpdate(condition.id, {
          operator: e.target.value as ComparisonOperator,
        })
      }
      className="p-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
      <option value="==">Eşittir (==)</option>
      <option value="!=">Eşit Değildir (!=)</option>
      <option value=">">Büyüktür (&gt;)</option>
      <option value="<">Küçüktür (&lt;)</option>
      <option value=">=">Büyük Eşittir (&gt;=)</option>
      <option value="<=">Küçük Eşittir (&lt;=)</option>
    </select>
    <Handle
      type="target"
      position={Position.Right}
      id={`right-${condition.id}`}
      className="w-3 h-3 !bg-yellow-400 hover:!bg-yellow-500 transition-colors"
    />
    <button
      onClick={() => onDelete(condition.id)}
      className="p-1 text-red-500 hover:text-red-600 focus:outline-none"
    >
      <X size={16} />
    </button>
  </div>
);

export const BlockNode = ({ id, data }: NodeProps<NodeData>) => {
  const typedData = data as NodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(typedData.value || "");
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateNode, removeNode } = useStore();
  const nodes = useNodes<CustomNode>();
  const edges = useEdges<CustomEdge>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<EdgeDetectionAlgorithm>(
    typedData.algorithm || "sobel"
  );
  const [operator, setOperator] = useState<ComparisonOperator>(
    (typedData.condition?.operator as ComparisonOperator) || "=="
  );

  const isMathNode = isMathOperation(typedData.type);
  const isSingleInputOperation = [
    "kare",
    "karekök",
    "mutlak",
    "faktöriyel",
    "yazdır",
    "dosyaoku",
    "gri",
  ].includes(typedData.type || "");

  useEffect(() => {
    if (typedData.type === "yazdır") {
      // Find text input edge
      const textInputEdge = edges.find(
        (edge) => edge.target === id && edge.targetHandle === "text"
      );
      if (textInputEdge) {
        const inputNode = nodes.find((n) => n.id === textInputEdge.source);
        if (inputNode) {
          const inputNodeData = inputNode.data as NodeData;
          let newValue: string | undefined;

          if (inputNodeData.type === "dosyaoku") {
            newValue = inputNodeData.fileContent || "";
          } else {
            newValue =
              inputNodeData.value?.toString() ||
              inputNodeData.result?.toString();
          }

          if (newValue !== inputValue) {
            setInputValue(newValue);
            if (newValue !== undefined) {
              console.log("Yazdır Node Text Input:", newValue);
            }
          }
        }
      } else if (inputValue !== undefined) {
        setInputValue(undefined);
      }
    }
  }, [typedData.type, edges, id, nodes, inputValue]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    updateNode(id, { value: e.target.value });
  };

  const handleValueSubmit = () => {
    updateNode(id, { value });
    setIsEditing(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      readFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      updateNode(id, { fileContent: content });
    };
    reader.readAsText(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      readImage(file);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      readImage(file);
    }
  };

  const readImage = (file: File) => {
    console.log("Reading image file:", file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        console.log("Image loaded, dimensions:", img.width, "x", img.height);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          console.log("Image data created:", imageData.data.length, "bytes");
          const originalImage = e.target?.result as string;
          console.log("Setting image data in node:", id);
          updateNode(id, {
            imageData: {
              width: img.width,
              height: img.height,
              data: Array.from(imageData.data),
            },
            originalImage,
          });
          setImagePreview(originalImage);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const nodeColorClass = getNodeColor(typedData.type || "");

  const addCondition = () => {
    const newCondition: Condition = {
      id: Math.random().toString(36).substr(2, 9),
      operator: "==",
      rightValue: 0,
    };

    const currentGroup = typedData.conditionGroup || {
      conditions: [],
      operators: [],
    };

    updateNode(id, {
      conditionGroup: {
        conditions: [...currentGroup.conditions, newCondition],
        operators:
          currentGroup.conditions.length > 0
            ? [...currentGroup.operators, "AND"]
            : [],
      },
    });
  };

  const updateCondition = (
    conditionId: string,
    updates: Partial<Condition>
  ) => {
    if (!typedData.conditionGroup) return;

    const updatedConditions = typedData.conditionGroup.conditions.map((c) =>
      c.id === conditionId ? { ...c, ...updates } : c
    );

    updateNode(id, {
      conditionGroup: {
        ...typedData.conditionGroup,
        conditions: updatedConditions,
      },
    });
  };

  const deleteCondition = (conditionId: string) => {
    if (!typedData.conditionGroup) return;

    const index = typedData.conditionGroup.conditions.findIndex(
      (c) => c.id === conditionId
    );
    if (index === -1) return;

    const updatedConditions = typedData.conditionGroup.conditions.filter(
      (c) => c.id !== conditionId
    );
    const updatedOperators = typedData.conditionGroup.operators.filter(
      (_, i) => i !== (index === 0 ? 0 : index - 1)
    );

    updateNode(id, {
      conditionGroup: {
        conditions: updatedConditions,
        operators: updatedOperators,
      },
    });
  };

  const toggleOperator = (index: number) => {
    if (!typedData.conditionGroup) return;

    const updatedOperators = [...typedData.conditionGroup.operators];
    updatedOperators[index] = updatedOperators[index] === "AND" ? "OR" : "AND";

    updateNode(id, {
      conditionGroup: {
        ...typedData.conditionGroup,
        operators: updatedOperators,
      },
    });
  };

  const renderConditionEditor = () => {
    if (typedData.type !== "if") return null;

    const conditionGroup = typedData.conditionGroup || {
      conditions: [],
      operators: [],
    };

    return (
      <div className="mt-2 p-2 bg-white/80 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Koşullar</p>
          <button
            onClick={addCondition}
            className="p-1 text-yellow-600 hover:text-yellow-700 focus:outline-none"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2">
          {conditionGroup.conditions.map((condition, index) => (
            <div key={condition.id} className="relative">
              <ConditionEditor
                condition={condition}
                onUpdate={updateCondition}
                onDelete={deleteCondition}
              />
              {index < conditionGroup.conditions.length - 1 && (
                <button
                  onClick={() => toggleOperator(index)}
                  className="mt-1 mb-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none"
                >
                  {conditionGroup.operators[index]}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative px-4 py-3 rounded-xl backdrop-blur-sm border-2 min-w-[180px] shadow-lg ${nodeColorClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md"
          onClick={() => removeNode(id)}
        >
          <X size={14} />
        </motion.button>
      )}

      <div className="flex flex-col">
        <div className="text-lg font-bold text-gray-800">{typedData.label}</div>
        <div className="text-gray-500 text-sm">{typedData.type}</div>

        {/* Edge Detection Algorithm Selector */}
        {typedData.type === "kenar" && (
          <div className="mt-2">
            <select
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value as EdgeDetectionAlgorithm);
                updateNode(id, {
                  algorithm: e.target.value as EdgeDetectionAlgorithm,
                });
              }}
              className="w-full p-2 text-sm bg-white/80 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="sobel">Sobel</option>
              <option value="prewitt">Prewitt</option>
              <option value="roberts">Roberts</option>
            </select>
          </div>
        )}

        {/* Display math operation results */}
        {isMathNode && typedData.result !== undefined && (
          <div className="mt-2 text-sm font-medium text-gray-700 bg-white/80 p-2 rounded-md">
            Sonuç: {typedData.result}
          </div>
        )}

        {/* Display image preview for image nodes */}
        {(typedData.type === "resimoku" ||
          ["gri", "parlaklik", "kontrast", "bulanik", "kenar"].includes(
            typedData.type || ""
          )) && (
          <div className="mt-2">
            {typedData.imageData && typedData.originalImage ? (
              <div className="flex flex-col gap-2">
                <div>
                  {typedData.imageData.data && (
                    <canvas
                      ref={(canvas) => {
                        if (canvas && typedData.imageData) {
                          const ctx = canvas.getContext("2d");
                          if (ctx) {
                            canvas.width = typedData.imageData.width;
                            canvas.height = typedData.imageData.height;
                            const imageData = new ImageData(
                              new Uint8ClampedArray(typedData.imageData.data),
                              typedData.imageData.width,
                              typedData.imageData.height
                            );
                            ctx.putImageData(imageData, 0, 0);
                          }
                        }
                      }}
                      width={typedData.imageData.width}
                      height={typedData.imageData.height}
                      className="max-w-full h-auto rounded-md"
                      style={{ maxHeight: "200px" }}
                    />
                  )}
                </div>
              </div>
            ) : typedData.type === "resimoku" ? (
              <div
                className={`mt-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
                  isDragging
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-300"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleImageDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <ImageIcon size={24} className="text-gray-400" />
                  <p className="text-sm text-gray-500 text-center">
                    Resmi sürükleyin veya tıklayarak seçin
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Variable block value display */}
        {isVariable(typedData.type) && (
          <div className="mt-2">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={value}
                  onChange={handleValueChange}
                  className="border rounded-md px-2 py-1 text-sm bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  autoFocus
                />
                <button
                  onClick={handleValueSubmit}
                  className="bg-violet-600 text-white px-3 py-1 rounded-md text-sm hover:bg-violet-700 transition-colors"
                >
                  Kaydet
                </button>
              </motion.div>
            ) : (
              <div
                className="text-sm cursor-pointer hover:bg-white/80 p-2 rounded-md transition-colors bg-white/60"
                onClick={() => setIsEditing(true)}
              >
                <span className="font-semibold">Değer:</span>{" "}
                {typedData.value || "Düzenlemek için tıklayın"}
              </div>
            )}
          </div>
        )}
        {typedData.type === "dosyaoku" && (
          <div
            className={`mt-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? "border-rose-400 bg-rose-50" : "border-gray-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload size={24} className="text-gray-400" />
              <p className="text-sm text-gray-500 text-center">
                Dosyayı sürükleyin veya tıklayarak seçin
              </p>
            </div>
            {typedData.fileContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm bg-white/80 p-2 rounded-md backdrop-blur-sm"
              >
                <span className="font-semibold">İçerik:</span>{" "}
                {typedData.fileContent.substring(0, 50)}
                {typedData.fileContent.length > 50 && "..."}
              </motion.div>
            )}
          </div>
        )}
        {typedData.type === "yazdır" && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={typedData.value || ""}
              onChange={(e) => updateNode(id, { value: e.target.value })}
              placeholder="Yazdırılacak metin..."
              className="w-full p-2 text-sm bg-white/80 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            {inputValue !== undefined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm bg-white/80 p-2 rounded-md backdrop-blur-sm"
              >
                <span className="font-semibold">Giriş:</span> {inputValue}
              </motion.div>
            )}
          </div>
        )}

        {/* Add condition editor for if blocks */}
        {renderConditionEditor()}
      </div>

      {/* Add handles for blocks */}
      {typedData.type === "if" ? (
        <>
          {/* True branch output */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
            style={{ left: "30%" }}
          />
          {/* False branch output */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 !bg-red-400 hover:!bg-red-500 transition-colors"
            style={{ left: "70%" }}
          />
        </>
      ) : typedData.type === "yazdır" ? (
        <>
          {/* Flow control input socket */}
          <Handle
            type="target"
            position={Position.Top}
            id="flow"
            className="w-3 h-3 !bg-purple-400 hover:!bg-purple-500 transition-colors"
            style={{ left: "30%" }}
          />
          {/* Text input socket */}
          <Handle
            type="target"
            position={Position.Top}
            id="text"
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
            style={{ left: "70%" }}
          />
          {/* Output socket */}
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      ) : typedData.type === "kenar" ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      ) : typedData.type === "parlaklik" ||
        typedData.type === "kontrast" ||
        typedData.type === "bulanik" ? (
        <>
          {/* Image input handle */}
          <Handle
            type="target"
            position={Position.Top}
            id="image"
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
            style={{ left: "30%" }}
          />
          {/* Intensity input handle */}
          <Handle
            type="target"
            position={Position.Top}
            id="intensity"
            className="w-3 h-3 !bg-purple-400 hover:!bg-purple-500 transition-colors"
            style={{ left: "70%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      ) : typedData.type === "gri" ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      ) : isMathNode ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="input1"
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
            style={{ left: isSingleInputOperation ? "50%" : "30%" }}
          />
          {!isSingleInputOperation && (
            <Handle
              type="target"
              position={Position.Top}
              id="input2"
              className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
              style={{ left: "70%" }}
            />
          )}
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      ) : (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
          />
        </>
      )}
    </motion.div>
  );
};

export default memo(BlockNode);
