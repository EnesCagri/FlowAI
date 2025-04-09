import { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps, useNodes, useEdges } from "@xyflow/react";
import { useStore } from "../store/useFlowStore";
import { motion } from "framer-motion";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { NodeData, MathOperation, mathOperations, EdgeData } from "../types";
import { processImage } from "../utils/imageProcessing";
import Image from "next/image";

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
    default:
      return "bg-gray-100 border-gray-300 hover:border-gray-400";
  }
};

export const BlockNode = ({ id, data }: NodeProps<NodeData>) => {
  const typedData = data as NodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(typedData.value || "");
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateNode, removeNode } = useStore();
  const nodes = useNodes<NodeData>();
  const edges = useEdges<EdgeData>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (typedData.type === "yazdır") {
      const inputEdge = edges.find((edge) => edge.target === id);
      if (inputEdge) {
        const inputNode = nodes.find((n) => n.id === inputEdge.source);
        if (inputNode) {
          let newValue: string | undefined;
          const inputNodeData = inputNode.data as NodeData;
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
              console.log("Yazdır Node Output:", newValue);
            }
          }
        }
      } else if (inputValue !== undefined) {
        setInputValue(undefined);
      }
    }
  }, [typedData.type, edges, id, nodes, inputValue]);

  const processImageEffect = () => {
    if (!typedData.type) return;

    const inputEdges = edges.filter((edge) => edge.target === id);
    if (inputEdges.length === 0) return;

    const inputNode = nodes.find((node) => node.id === inputEdges[0].source);
    if (!inputNode?.data) return;
    const inputNodeData = inputNode.data as NodeData;
    if (!inputNodeData.imageData) return;

    const inputData = inputNodeData.imageData;
    const intensity = typedData.value || 0;

    const processed = processImage(
      Array.from(inputData.data),
      inputData.width,
      inputData.height,
      typedData.type,
      intensity
    );

    if (processed) {
      updateNode(id, {
        ...typedData,
        imageData: {
          width: processed.width,
          height: processed.height,
          data: processed.data,
        },
        originalImage: processed.originalImage,
        processed: true,
      });
    }
  };

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
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          updateNode(id, {
            imageData: {
              width: img.width,
              height: img.height,
              data: Array.from(imageData.data),
              originalImage: e.target?.result as string,
            },
          });
          setImagePreview(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isMathOperation = mathOperations.includes(
    typedData.type as MathOperation
  );
  const isSingleInputOperation = [
    "kare",
    "karekök",
    "mutlak",
    "faktöriyel",
    "yazdır",
    "dosyaoku",
    "gri",
  ].includes(typedData.type as MathOperation);
  const nodeColorClass = getNodeColor(typedData.type || "");

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
        {typedData.type === "değişken" && (
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
        {typedData.type === "yazdır" && inputValue !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm bg-white/80 p-2 rounded-md backdrop-blur-sm"
          >
            <span className="font-semibold">Giriş:</span> {inputValue}
          </motion.div>
        )}
        {typedData.type === "resimoku" && (
          <div
            className={`mt-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? "border-purple-400 bg-purple-50" : "border-gray-300"
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
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2"
              >
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="max-w-full h-auto rounded-md"
                  style={{ maxHeight: "200px" }}
                />
              </motion.div>
            )}
          </div>
        )}
        {["gri", "parlaklik", "kontrast", "bulanik"].includes(
          typedData.type || ""
        ) &&
          imagePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <Image
                src={imagePreview}
                alt="Processed Preview"
                width={200}
                height={200}
                className="max-w-full h-auto rounded-md"
                style={{ maxHeight: "200px" }}
              />
            </motion.div>
          )}
      </div>

      {typedData.type === "dosyaoku" || typedData.type === "resimoku" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
        />
      ) : ["parlaklik", "kontrast", "bulanik"].includes(
          typedData.type || ""
        ) ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="image"
            className="w-3 h-3 !bg-blue-400 hover:!bg-blue-500 transition-colors"
            style={{ left: "30%" }}
          />
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
      ) : isMathOperation ? (
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
