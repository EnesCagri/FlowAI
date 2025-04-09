import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { DragData } from "../types";

const nodeTypes = [
  { type: "değişken", label: "Değişken" },
  { type: "topla", label: "Toplama" },
  { type: "çıkar", label: "Çıkarma" },
  { type: "çarp", label: "Çarpma" },
  { type: "böl", label: "Bölme" },
  { type: "kare", label: "Kare" },
  { type: "karekök", label: "Karekök" },
  { type: "mutlak", label: "Mutlak Değer" },
  { type: "üs", label: "Üs Alma" },
  { type: "mod", label: "Mod Alma" },
  { type: "faktöriyel", label: "Faktöriyel" },
  { type: "yazdır", label: "Yazdır" },
  { type: "dosyaoku", label: "Dosya Oku" },
  { type: "resimoku", label: "Resim Oku" },
  { type: "gri", label: "Gri Tonlama" },
  { type: "parlaklik", label: "Parlaklık" },
  { type: "kontrast", label: "Kontrast" },
  { type: "bulanik", label: "Bulanıklaştır" },
];

const Sidebar = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNodes = nodeTypes.filter(
    (node) =>
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
    label: string
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ type: nodeType, label })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 h-full bg-gray-900/90 backdrop-blur-lg border-r border-gray-800 shadow-xl flex flex-col"
    >
      {/* Fixed Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-gray-100 mb-3">Bloklar</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Blok ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800/50 text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Scrollable Content - Fixed height for 10 items */}
      <div className="overflow-hidden">
        <div
          className="overflow-y-auto sidebar-scroll"
          style={{
            height: "1000px",
            maxHeight: "1000px",
          }}
        >
          <div className="p-4 space-y-2">
            {filteredNodes.map((node) => (
              <div
                key={node.type}
                className={`h-12 p-3 rounded-lg cursor-move shadow-lg flex flex-col justify-center ${
                  node.type === "değişken"
                    ? "bg-violet-900/50 border border-violet-800 hover:border-violet-700"
                    : node.type === "yazdır"
                    ? "bg-emerald-900/50 border border-emerald-800 hover:border-emerald-700"
                    : node.type === "resimoku" ||
                      node.type === "gri" ||
                      node.type === "parlaklik" ||
                      node.type === "kontrast" ||
                      node.type === "bulanik"
                    ? "bg-purple-900/50 border border-purple-800 hover:border-purple-700"
                    : "bg-blue-900/50 border border-blue-800 hover:border-blue-700"
                }`}
                draggable
                onDragStart={(e) => onDragStart(e, node.type, node.label)}
              >
                <div className="text-gray-100 font-medium leading-tight">
                  {node.label}
                </div>
                <div className="text-gray-400 text-xs leading-tight">
                  {node.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
