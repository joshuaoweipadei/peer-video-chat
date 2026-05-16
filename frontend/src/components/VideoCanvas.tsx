import type { VideoCanvasProps } from '../types'

const VideoCanvas = ({
 videoRef,
 canvasRef,
 muted = false,
 label = 'Video',
 overlayOn = true,
 className = '',
}: VideoCanvasProps) => {
  return (
    <div className={`video-stage scanlines ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        aria-label={label}
      />
      {overlayOn && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
export default VideoCanvas
