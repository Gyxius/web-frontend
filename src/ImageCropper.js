import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ image, onCropComplete, onCancel, theme }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px',
        background: theme?.card || '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: 20, 
          fontWeight: 700,
          color: theme?.text || '#000'
        }}>
          Crop Image for Banner
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: 14, 
          color: theme?.textMuted || '#666' 
        }}>
          Drag to reposition • Pinch or scroll to zoom
        </p>
      </div>
      
      <div style={{ position: 'relative', flex: 1, background: '#000' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div style={{
        padding: '20px',
        background: theme?.card || '#fff',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontSize: 13, 
            fontWeight: 600,
            color: theme?.text || '#000'
          }}>
            Zoom: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              outline: 'none',
              background: theme?.border || '#ddd',
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              border: `2px solid ${theme?.border || '#ddd'}`,
              background: theme?.card || '#fff',
              color: theme?.text || '#000',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={createCroppedImage}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${theme?.primary || '#58CC02'}, ${theme?.primaryDark || '#46A302'})`,
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(88,204,2,0.3)',
            }}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      // Convert blob to data URL instead of creating a temporary blob URL
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
}

export default ImageCropper;
