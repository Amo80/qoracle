type CanvasLike = Readonly<{
  getContext: (name: string) => unknown;
}>;

type DocumentLike = Readonly<{
  createElement: (name: string) => CanvasLike;
}>;

export function detectWebGLSupport(documentLike?: DocumentLike) {
  if (!documentLike) return false;

  try {
    const canvas = documentLike.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
