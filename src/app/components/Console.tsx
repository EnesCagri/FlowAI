import { motion } from "framer-motion";

interface ConsoleProps {
  output: string[];
  onClear?: () => void;
  onClearCanvas?: () => void;
  onRun?: () => void;
}

export default function Console({
  output,
  onClear,
  onClearCanvas,
  onRun,
}: ConsoleProps) {
  return (
    <div className="w-[800px] h-[300px] bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-800 shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <h3 className="text-white font-medium">Konsol</h3>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRun}
            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Çalıştır
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearCanvas}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Canvas'ı Temizle
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Çıktıyı Temizle
          </motion.button>
        </div>
      </div>
      <div className="p-4 h-[calc(100%-3.5rem)] overflow-y-auto font-mono text-sm">
        {output.length === 0 ? (
          <div className="text-gray-500 italic">Henüz çıktı yok...</div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="text-gray-300">
              <span className="text-gray-500 mr-2">{">"}</span>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
