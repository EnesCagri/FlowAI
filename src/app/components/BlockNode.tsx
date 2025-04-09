import { memo, useState, useEffect, useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useStore } from "../store/useFlowStore";
import { motion } from "framer-motion";
import { X, FileText, Upload, Image as ImageIcon } from "lucide-react";
import { NodeData, MathOperation, mathOperations } from "../types";
import { processImage } from "../utils/imageProcessing";

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
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.value || "");
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateNode, removeNode } = useStore();
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (data.type === "yazdır") {
      const inputEdge = edges.find((edge) => edge.target === id);
      if (inputEdge) {
        const inputNode = nodes.find((n) => n.id === inputEdge.source);
        if (inputNode) {
          let newValue: string | undefined;
          if (inputNode.data.type === "dosyaoku") {
            newValue = inputNode.data.fileContent || "";
          } else {
            newValue =
              inputNode.data.value || inputNode.data.result?.toString();
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
  }, [data.type, edges, id, nodes, inputValue]);

  const processImageEffect = () => {
    if (["gri", "parlaklik", "kontrast", "bulanik"].includes(data.type)) {
      const inputEdge = edges.find((edge) => edge.target === id);
      if (inputEdge) {
        const inputNode = nodes.find((n) => n.id === inputEdge.source);
        if (inputNode?.data.imageData) {
          const { width, height, data: pixelData } = inputNode.data.imageData;

          let intensity: number | undefined;
          if (["parlaklik", "kontrast", "bulanik"].includes(data.type)) {
            const intensityEdge = edges.find(
              (edge) => edge.target === id && edge.targetHandle === "intensity"
            );
            if (intensityEdge) {
              const intensityNode = nodes.find(
                (n) => n.id === intensityEdge.source
              );
              intensity = Number(
                intensityNode?.data.value || intensityNode?.data.result || 0
              );
            }
          }

          const result = processImage(
            pixelData,
            width,
            height,
            data.type,
            intensity
          );
          if (result) {
            updateNode(id, { imageData: result });
            setImagePreview(result.originalImage);
          }
        }
      }
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

  const isMathOperation = mathOperations.includes(data.type as MathOperation);
  const isSingleInputOperation = [
    "kare",
    "karekök",
    "mutlak",
    "faktöriyel",
    "yazdır",
    "dosyaoku",
    "gri",
  ].includes(data.type as MathOperation);
  const nodeColorClass = getNodeColor(data.type);

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
        <div className="text-lg font-bold text-gray-800">{data.label}</div>
        <div className="text-gray-500 text-sm">{data.type}</div>
        {data.type === "değişken" && (
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
                {data.value || "Düzenlemek için tıklayın"}
              </div>
            )}
          </div>
        )}
        {data.type === "dosyaoku" && (
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
            {data.fileContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm bg-white/80 p-2 rounded-md backdrop-blur-sm"
              >
                <span className="font-semibold">İçerik:</span>{" "}
                {data.fileContent.substring(0, 50)}
                {data.fileContent.length > 50 && "..."}
              </motion.div>
            )}
          </div>
        )}
        {data.type === "yazdır" && inputValue !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm bg-white/80 p-2 rounded-md backdrop-blur-sm"
          >
            <span className="font-semibold">Giriş:</span> {inputValue}
          </motion.div>
        )}
        {data.type === "resimoku" && (
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
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full h-auto rounded-md"
                  style={{ maxHeight: "200px" }}
                />
              </motion.div>
            )}
          </div>
        )}
        {["gri", "parlaklik", "kontrast", "bulanik"].includes(data.type) &&
          imagePreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <img
                src={imagePreview}
                alt="Processed Preview"
                className="max-w-full h-auto rounded-md"
                style={{ maxHeight: "200px" }}
              />
            </motion.div>
          )}
      </div>

      {data.type === "dosyaoku" || data.type === "resimoku" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-green-400 hover:!bg-green-500 transition-colors"
        />
      ) : ["parlaklik", "kontrast", "bulanik"].includes(data.type) ? (
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
      ) : data.type === "gri" ? (
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
