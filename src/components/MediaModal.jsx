import { X } from "lucide-react";

const MediaModal = ({ mediaItem, onClose }) => {
  if (!mediaItem) return null;

  // We are now only dealing with standard file URLs from your custom backend
  const isVideo = mediaItem.type === 'video' || mediaItem.url.match(/\.(mp4|webm|ogg)$/i) || mediaItem.url.includes('.mp4');

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-full flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        
        {/* Header */}
        <div className="absolute top-0 w-full flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
          <div className="text-white text-sm font-medium px-2 drop-shadow-md">
            {mediaItem.caption || 'Media Viewer'}
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors pointer-events-auto"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-[50vh] p-4 md:p-8">
          {isVideo ? (
            <video 
              src={mediaItem.url} 
              controls 
              autoPlay
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          ) : (
            <img 
              src={mediaItem.url} 
              alt={mediaItem.caption || 'Expanded media'} 
              className="max-w-full max-h-[85vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;