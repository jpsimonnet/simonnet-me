// Worker de compression d'images (fallback léger sans dépendances externes)
// Réception : { type: "process", payload: { buffer, options } }
// Réponse : { type: "result", payload: { previews, meta } } ou { type: "error", payload:{message} }

self.addEventListener("message", async (event) => {
  const { type, payload } = event.data || {};
  if (type !== "process" || !payload) return;

  try {
    const { buffer, options } = payload;
    const result = await processImage(buffer, options || {});
    self.postMessage({ type: "result", payload: result });
  } catch (err) {
    self.postMessage({
      type: "error",
      payload: { message: err?.message || "Erreur de compression" },
    });
  }
});

async function processImage(buffer, options) {
  const {
    quality = 0.75,
    targetW,
    targetH,
    exportWebP = true,
    exportPNG = true,
    exportJPEG = true,
    originalMime = "image/jpeg",
    fileName = "image",
    rotation = 0,
    flipH = false,
    flipV = false,
  } = options;

  const blob = new Blob([buffer], { type: originalMime });
  const bitmap = await createImageBitmap(blob);

  // Ajuster les dimensions selon la rotation
  let destW = targetW || bitmap.width;
  let destH = targetH || bitmap.height;

  // Si rotation de 90 ou 270 degrés, inverser largeur et hauteur
  if (rotation === 90 || rotation === 270) {
    [destW, destH] = [destH, destW];
  }

  // Dessin dans un canvas hors-écran
  const canvas = new OffscreenCanvas(destW, destH);
  const ctx = canvas.getContext("2d");

  // Appliquer les transformations
  ctx.save();

  // Déplacer l'origine au centre pour les transformations
  ctx.translate(destW / 2, destH / 2);

  // Appliquer la rotation
  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Appliquer les retournements
  const scaleX = flipH ? -1 : 1;
  const scaleY = flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Dessiner l'image centrée
  const drawW = rotation === 90 || rotation === 270 ? destH : destW;
  const drawH = rotation === 90 || rotation === 270 ? destW : destH;
  ctx.drawImage(bitmap, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();

  const processedMime = normalizeMime(originalMime);
  const processedBlob = await canvasToBlob(canvas, processedMime, quality);

  const previews = {
    processed: {
      blob: processedBlob,
      url: URL.createObjectURL(processedBlob),
    },
  };

  const meta = {
    fileName,
    original: {
      width: bitmap.width,
      height: bitmap.height,
      size: buffer.byteLength,
      mime: originalMime,
    },
    processed: {
      width: destW,
      height: destH,
      size: processedBlob.size,
      mime: processedBlob.type || processedMime,
    },
  };

  // Export WebP
  if (exportWebP) {
    try {
      const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
      previews.webp = {
        blob: webpBlob,
        url: URL.createObjectURL(webpBlob),
      };
      meta.webp = {
        width: destW,
        height: destH,
        size: webpBlob.size,
        mime: "image/webp",
      };
    } catch (err) {
      // WebP non supporté
    }
  }

  // Export PNG
  if (exportPNG) {
    try {
      const pngBlob = await canvasToBlob(canvas, "image/png", quality);
      previews.png = {
        blob: pngBlob,
        url: URL.createObjectURL(pngBlob),
      };
      meta.png = {
        width: destW,
        height: destH,
        size: pngBlob.size,
        mime: "image/png",
      };
    } catch (err) {
      // PNG non supporté
    }
  }

  // Export JPEG
  if (exportJPEG) {
    try {
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      previews.jpeg = {
        blob: jpegBlob,
        url: URL.createObjectURL(jpegBlob),
      };
      meta.jpeg = {
        width: destW,
        height: destH,
        size: jpegBlob.size,
        mime: "image/jpeg",
      };
    } catch (err) {
      // JPEG non supporté
    }
  }

  bitmap.close();
  return { previews, meta };
}

async function canvasToBlob(canvas, mime, quality) {
  if (typeof canvas.convertToBlob === "function") {
    return canvas.convertToBlob({ type: mime, quality });
  }
  return new Promise((resolve, reject) => {
    // @ts-ignore
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Échec toBlob"));
    }, mime, quality);
  });
}

function normalizeMime(mime) {
  if (!mime || typeof mime !== "string") return "image/jpeg";
  const lower = mime.toLowerCase();
  if (lower === "image/jpeg" || lower === "image/png" || lower === "image/gif") {
    return lower;
  }
  return "image/jpeg";
}
