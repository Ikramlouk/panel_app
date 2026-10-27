import { useState } from 'react';
import api from '../services/api';
import { Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';

export default function Detection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data.detections);
    } catch (err) {
      console.error(err);
      alert('Mochkil f l\'detection. Chof l\'console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Détection YOLO</h1>
      
      <div className="bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 mb-6">
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-80 object-contain rounded-lg mb-4" />
          ) : (
            <ImageIcon size={48} className="text-gray-400 mb-4" />
          )}
          <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer" />
        </div>

        <button onClick={handleDetect} disabled={!file || loading} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Upload size={20} /> {loading ? 'Détection en cours...' : 'Lancer la détection'}
        </button>
      </div>

      {result && (
        <div className="mt-8 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="text-success" /> Résultats ({result.length})
          </h2>
          <div className="space-y-2">
            {result.map((det, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-[#121216] p-3 rounded-lg">
                <span className="font-semibold text-gray-900 dark:text-white">{det.class}</span>
                <span className="text-sm text-gray-500">Confiance: {(det.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
            {result.length === 0 && <p className="text-gray-500">Ma kaynach chi haja mdetectya.</p>}
          </div>
        </div>
      )}
    </div>
  );
}