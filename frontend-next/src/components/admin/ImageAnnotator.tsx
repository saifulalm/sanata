"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { RefObject } from "react";
import {
  MousePointer2, Minus, MoveRight, Square, Circle, Type,
  Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Download, X,
  Pencil, FlipHorizontal2, FlipVertical2, RotateCw, RotateCcw,
  Copy, Trash, Plus, Check, ChevronDown, Highlighter, Paintbrush,
  Triangle, Star, Italic, AlignCenter, Maximize2, Ruler,
  Eye, EyeOff, Scissors, Layers, MinusIcon, PencilLine, CircleDot,
  MessageSquare, Palette, Droplet, Bold, AlignLeft, Move, XCircle,
  ArrowRightLeft, Spline, PanelTop, Quote
} from "lucide-react";
import Image from "next/image";

export type AnnotationTool =
  | "select"
  | "move"
  | "line"
  | "dashed-line"
  | "arrow"
  | "arrow-double"
  | "arrow-right"
  | "arrow-up"
  | "arrow-down"
  | "curved"
  | "rect"
  | "rect-rounded"
  | "circle"
  | "ellipse"
  | "triangle"
  | "star"
  | "callout-box"
  | "text"
  | "callout"
  | "freehand"
  | "highlighter"
  | "eraser"
  | "blur"
  | "ruler"
  | "measurement";

export type AnnotationData = {
  id: string;
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  opacity: number;
  points: number[];
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  dashed?: boolean;
  filled?: boolean;
  fillColor?: string;
  blurRadius?: number;
};

interface ImageAnnotatorProps {
  imageUrl: string;
  annotations: AnnotationData[];
  onSave: (annotatedImageUrl: string, annotations: AnnotationData[]) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#000000", "#374151", "#6b7280", "#9ca3af", "#ffffff",
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12];
const OPACITIES = [100, 80, 60, 40, 20];

export function ImageAnnotator({
  imageUrl,
  annotations,
  onSave,
  onCancel,
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<AnnotationTool>("line");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<AnnotationData[]>(annotations);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationData | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [isDashed, setIsDashed] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const [fillColor, setFillColor] = useState(PRESET_COLORS[0]);
  const [blurRadius, setBlurRadius] = useState(10);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showToolOptions, setShowToolOptions] = useState(true);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [hiddenAnnotations, setHiddenAnnotations] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Get current annotations from history
  const currentAnnotations = history.slice(0, historyIndex + 1);

  // Get visible annotations (excluding hidden ones)
  const visibleAnnotations = useMemo(() => {
    return currentAnnotations.filter(ann => !hiddenAnnotations.has(ann.id));
  }, [currentAnnotations, hiddenAnnotations]);

  // Create annotation with current settings
  const createAnnotation = useCallback((points: number[]): AnnotationData => {
    return {
      id: Date.now().toString(),
      tool,
      color,
      strokeWidth,
      opacity,
      points,
      text: tool === "text" || tool === "callout" ? textInput : undefined,
      fontSize: tool === "text" || tool === "callout" ? fontSize : undefined,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
      textAlign,
      backgroundColor: tool === "callout" ? fillColor : undefined,
      dashed: isDashed,
      filled: isFilled,
      fillColor: isFilled ? fillColor : undefined,
      blurRadius: tool === "blur" ? blurRadius : undefined,
    };
  }, [tool, color, strokeWidth, opacity, textInput, fontSize, isBold, isItalic, textAlign, isDashed, isFilled, fillColor, blurRadius]);

  // Helper drawing functions
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawArrowRight = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => { drawArrow(ctx, x1, y1, x2, y2); };
  const drawArrowUp = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => { drawArrow(ctx, x1, y2, x1, y1); };
  const drawArrowDown = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => { drawArrow(ctx, x1, y1, x1, y2); };

  // Double-ended arrow
  const drawArrowDouble = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headLength = 12;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    // Main line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // Start arrow head
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - headLength * Math.cos(angle - Math.PI / 6), y1 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - headLength * Math.cos(angle + Math.PI / 6), y1 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    // End arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  // Dashed line
  const drawDashedLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Curved line (bezier)
  const drawCurvedLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const cpOffset = Math.abs(x2 - x1) * 0.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX + cpOffset, midY - cpOffset, x2, y2);
    ctx.stroke();
  };

  // Callout box (text box with border)
  const drawCalloutBox = (ctx: CanvasRenderingContext2D, ann: AnnotationData, x: number, y: number) => {
    if (!ann.text) return;
    ctx.font = `${ann.fontWeight || 'normal'} ${ann.fontStyle || 'normal'} ${ann.fontSize || 16}px system-ui, sans-serif`;
    const metrics = ctx.measureText(ann.text);
    const padding = 10;
    const width = metrics.width + padding * 2;
    const height = (ann.fontSize || 16) * 1.4 + padding * 2;
    ctx.fillStyle = ann.backgroundColor || ann.color + "20";
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y - height, width, height, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ann.color;
    ctx.fillText(ann.text, x + padding, y - padding);
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, filled?: boolean, fillColor?: string) => {
    const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    ctx.beginPath();
    ctx.arc(x1, y1, r, 0, Math.PI * 2);
    if (filled) { ctx.fillStyle = fillColor || ctx.strokeStyle; ctx.fill(); }
    ctx.stroke();
  };

  const drawEllipse = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, filled?: boolean, fillColor?: string) => {
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    const cx = Math.min(x1, x2) + rx;
    const cy = Math.min(y1, y2) + ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (filled) { ctx.fillStyle = fillColor || ctx.strokeStyle; ctx.fill(); }
    ctx.stroke();
  };

  const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
  };

  const drawTriangle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo((x1 + x2) / 2, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x1, y2);
    ctx.closePath();
    ctx.stroke();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const outerR = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
    const innerR = outerR * 0.4;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
      else ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
      ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawCallout = (ctx: CanvasRenderingContext2D, ann: AnnotationData, x: number, y: number) => {
    if (!ann.text) return;
    ctx.font = `${ann.fontWeight || 'normal'} ${ann.fontStyle || 'normal'} ${ann.fontSize || 16}px system-ui, sans-serif`;
    const metrics = ctx.measureText(ann.text);
    const padding = 8;
    const width = metrics.width + padding * 2;
    const height = (ann.fontSize || 16) * 1.5 + padding * 2;
    ctx.fillStyle = ann.backgroundColor || ann.color + "40";
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = 2;
    roundedRect(ctx, x, y - height, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ann.color;
    ctx.fillText(ann.text, x + padding, y - padding);
  };

  const drawRuler = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color + "80";
    ctx.lineWidth = 1;
    const tickCount = Math.floor(length / 20);
    for (let i = 0; i <= tickCount; i++) {
      const t = i / tickCount;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5 * Math.cos(angle + Math.PI / 2), y - 5 * Math.sin(angle + Math.PI / 2));
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5 * Math.cos(angle + Math.PI / 2), y + 5 * Math.sin(angle + Math.PI / 2));
      ctx.stroke();
    }
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, strokeWidth: number) => {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    drawRuler(ctx, x1, y1, x2, y2, color);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    const label = `${Math.round(length)}px`;
    const labelWidth = ctx.measureText(label).width + 8;
    ctx.fillRect(midX - labelWidth / 2, midY - 10, labelWidth, 20);
    ctx.strokeRect(midX - labelWidth / 2, midY - 10, labelWidth, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, midX, midY + 4);
  };

  // Draw everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    if (!canvas || !ctx || !img || !imageLoaded) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all visible annotations
    visibleAnnotations.forEach((ann) => {
      if (!ann) return;
      ctx.globalAlpha = ann.opacity / 100;
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (ann.dashed) ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);

      const [x1, y1, x2, y2] = ann.points;

      switch (ann.tool) {
        case "line":
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          break;

        case "dashed-line":
          drawDashedLine(ctx, x1, y1, x2, y2);
          break;

        case "curved":
          drawCurvedLine(ctx, x1, y1, x2, y2);
          break;

        case "arrow":
          drawArrow(ctx, x1, y1, x2, y2);
          break;

        case "arrow-double":
          drawArrowDouble(ctx, x1, y1, x2, y2);
          break;

        case "arrow-right":
          drawArrowRight(ctx, x1, y1, x2, y2);
          break;

        case "arrow-up":
          drawArrowUp(ctx, x1, y1, x2, y2);
          break;

        case "arrow-down":
          drawArrowDown(ctx, x1, y1, x2, y2);
          break;

        case "rect":
          if (ann.filled) {
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
          }
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          break;

        case "rect-rounded":
          roundedRect(ctx, x1, y1, x2 - x1, y2 - y1, 10);
          break;

        case "circle":
          drawCircle(ctx, x1, y1, x2, y2, ann.filled, ann.fillColor);
          break;

        case "ellipse":
          drawEllipse(ctx, x1, y1, x2, y2, ann.filled, ann.fillColor);
          break;

        case "triangle":
          drawTriangle(ctx, x1, y1, x2, y2);
          break;

        case "star":
          drawStar(ctx, x1, y1, x2, y2);
          break;

        case "text":
          if (ann.text) {
            const font = `${ann.fontWeight || 'normal'} ${ann.fontStyle || 'normal'} ${ann.fontSize || 16}px system-ui, sans-serif`;
            ctx.font = font;
            ctx.textAlign = ann.textAlign || "left";
            ctx.fillText(ann.text, x1, y1);
          }
          break;

        case "callout":
          if (ann.text) {
            drawCallout(ctx, ann, x1, y1);
          }
          break;

        case "callout-box":
          if (ann.text) {
            drawCalloutBox(ctx, ann, x1, y1);
          }
          break;

        case "freehand":
          ctx.beginPath();
          ctx.moveTo(ann.points[0], ann.points[1]);
          for (let i = 2; i < ann.points.length; i += 2) {
            ctx.lineTo(ann.points[i], ann.points[i + 1]);
          }
          ctx.stroke();
          break;

        case "highlighter":
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth * 3;
          ctx.beginPath();
          ctx.moveTo(ann.points[0], ann.points[1]);
          for (let i = 2; i < ann.points.length; i += 2) {
            ctx.lineTo(ann.points[i], ann.points[i + 1]);
          }
          ctx.stroke();
          break;

        case "blur":
          // Apply blur effect (simplified - real blur would need OffscreenCanvas)
          ctx.filter = `blur(${ann.blurRadius}px)`;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
          break;

        case "ruler":
          drawRuler(ctx, x1, y1, x2, y2, ann.color);
          break;

        case "measurement":
          drawMeasurement(ctx, x1, y1, x2, y2, ann.color, ann.strokeWidth);
          break;
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    });

    // Draw current annotation being drawn with preview effect (dashed line)
    if (currentAnnotation) {
      const ann = currentAnnotation;
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([8, 4]); // Dashed preview line

      const [x1, y1, x2, y2] = ann.points;

      switch (ann.tool) {
        case "line":
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          // Draw start and end points
          ctx.setLineDash([]);
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x1, y1, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x2, y2, 4, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "arrow":
        case "arrow-right":
        case "arrow-up":
        case "arrow-down":
          drawArrow(ctx, x1, y1, x2, y2);
          break;

        case "rect":
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          break;

        case "rect-rounded":
          roundedRect(ctx, x1, y1, x2 - x1, y2 - y1, 10);
          break;

        case "circle":
          drawCircle(ctx, x1, y1, x2, y2, ann.filled, ann.fillColor);
          break;

        case "ellipse":
          drawEllipse(ctx, x1, y1, x2, y2, ann.filled, ann.fillColor);
          break;

        case "triangle":
          drawTriangle(ctx, x1, y1, x2, y2);
          break;

        case "star":
          drawStar(ctx, x1, y1, x2, y2);
          break;

        case "freehand":
          ctx.beginPath();
          ctx.moveTo(ann.points[0], ann.points[1]);
          for (let i = 2; i < ann.points.length; i += 2) {
            ctx.lineTo(ann.points[i], ann.points[i + 1]);
          }
          ctx.stroke();
          break;

        case "highlighter":
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth * 3;
          ctx.beginPath();
          ctx.moveTo(ann.points[0], ann.points[1]);
          for (let i = 2; i < ann.points.length; i += 2) {
            ctx.lineTo(ann.points[i], ann.points[i + 1]);
          }
          ctx.stroke();
          break;

        case "ruler":
          drawRuler(ctx, x1, y1, x2, y2, ann.color);
          break;

        case "measurement":
          drawMeasurement(ctx, x1, y1, x2, y2, ann.color, ann.strokeWidth);
          break;
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
  }, [visibleAnnotations, currentAnnotation, imageLoaded]);

  // Initialize canvas size when image loads
  useEffect(() => {
    const img = new globalThis.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      // Fallback: try without crossOrigin
      const img2 = new globalThis.Image();
      img2.onload = () => {
        imageRef.current = img2;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img2.naturalWidth;
          canvas.height = img2.naturalHeight;
          setImageLoaded(true);
        }
      };
      img2.src = imageUrl;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redraw when annotations change
  useEffect(() => {
    draw();
  }, [draw]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // Angle snapping helper - snaps to 45-degree increments when shift is held
  const snapToAngle = (x1: number, y1: number, x2: number, y2: number, snapEnabled: boolean) => {
    if (!snapEnabled) return { x2, y2 };

    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Snap to nearest 45-degree angle
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    return {
      x2: x1 + distance * Math.cos(snapAngle),
      y2: y1 + distance * Math.sin(snapAngle),
    };
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "text") {
      const coords = getCanvasCoords(e);
      if (coords) {
        setTextPosition(coords);
      }
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    setStartPoint(coords);

    if (tool === "freehand" || tool === "highlighter") {
      setCurrentAnnotation({
        id: Date.now().toString(),
        tool,
        color,
        strokeWidth,
        opacity,
        points: [coords.x, coords.y],
      });
    } else {
      setCurrentAnnotation(createAnnotation([coords.x, coords.y, coords.x, coords.y]));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (tool === "freehand" || tool === "highlighter") {
      setCurrentAnnotation((prev) =>
        prev ? { ...prev, points: [...prev.points, coords.x, coords.y] } : null
      );
    } else {
      // Apply angle snapping when shift is held
      const isLineTool = ["line", "arrow", "arrow-right", "arrow-up", "arrow-down", "ruler", "measurement"].includes(tool);
      const snapped = isLineTool ? snapToAngle(startPoint.x, startPoint.y, coords.x, coords.y, e.shiftKey) : { x2: coords.x, y2: coords.y };

      setCurrentAnnotation((prev) =>
        prev ? { ...prev, points: [startPoint.x, startPoint.y, snapped.x2, snapped.y2] } : null
      );
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentAnnotation) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentAnnotation);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentAnnotation(null);
  };

  // Add text annotation
  const handleAddText = () => {
    if (textInput && textPosition) {
      const newAnnotation = createAnnotation([textPosition.x, textPosition.y, textPosition.x, textPosition.y]);
      newAnnotation.text = textInput;
      newAnnotation.fontSize = fontSize;
      newAnnotation.fontWeight = isBold ? "bold" : "normal";
      newAnnotation.fontStyle = isItalic ? "italic" : "normal";
      newAnnotation.textAlign = textAlign;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotation);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setTextInput("");
    setTextPosition(null);
  };

  // Toggle annotation visibility
  const toggleAnnotationVisibility = (id: string) => {
    setHiddenAnnotations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete all annotations
  const deleteAllAnnotations = () => {
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Delete selected or last annotation
  const deleteLast = () => {
    if (selectedAnnotation) {
      setHistory(history.filter((a) => a.id !== selectedAnnotation));
      setHistoryIndex(Math.max(0, historyIndex - 1));
      setSelectedAnnotation(null);
    } else if (historyIndex >= 0) {
      setHistory(history.slice(0, historyIndex));
      setHistoryIndex(Math.max(0, historyIndex - 1));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "l":
            setTool("line");
            break;
          case "d":
            setTool("dashed-line");
            break;
          case "k":
            setTool("curved");
            break;
          case "a":
            setTool("arrow");
            break;
          case "b":
            setTool("arrow-double");
            break;
          case "r":
            setTool("rect");
            break;
          case "c":
            setTool("circle");
            break;
          case "t":
            setTool("text");
            break;
          case "e":
            setTool("freehand");
            break;
          case "s":
            setTool("select");
            break;
          case "escape":
            setTextPosition(null);
            setSelectedAnnotation(null);
            break;
        }
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            undo();
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "s":
            e.preventDefault();
            handleSave();
            break;
        }
      }

      // Delete shortcut
      if (e.key === "Delete" || e.key === "Backspace") {
        if (textPosition) return; // Don't delete while in text input
        deleteLast();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [textPosition]);

  // Export and save
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      if (!blob) {
        alert("Gagal mengekspor gambar");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSave(dataUrl, currentAnnotations);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengekspor gambar");
    }
  };

  // Check if tool requires options
  const needsTextOptions = ["text", "callout", "callout-box"].includes(tool);
  const needsShapeOptions = ["rect", "circle", "ellipse", "triangle", "star"].includes(tool);
  const needsDrawingOptions = tool === "freehand" || tool === "highlighter";
  const isLineTool = ["line", "dashed-line", "curved", "arrow", "arrow-double", "arrow-right", "arrow-up", "arrow-down", "ruler", "measurement"].includes(tool);

  // Get cursor style based on tool and interaction state
  const getCursorStyle = () => {
    switch (tool) {
      case "select":
        return selectedAnnotation ? "grab" : "default";
      case "move":
        return "move";
      case "text":
      case "callout":
      case "callout-box":
        return "text";
      case "freehand":
      case "highlighter":
        return "crosshair";
      case "line":
      case "dashed-line":
      case "curved":
      case "arrow":
      case "arrow-double":
      case "arrow-right":
      case "arrow-up":
      case "arrow-down":
        return "crosshair"; // Crosshair for precision line drawing
      case "rect":
      case "rect-rounded":
      case "circle":
      case "ellipse":
      case "triangle":
      case "star":
        return "crosshair"; // Crosshair for shape drawing
      case "ruler":
      case "measurement":
        return "crosshair"; // Crosshair for precise measurement
      case "blur":
        return "crosshair";
      case "eraser":
        return "crosshair";
      default:
        return "crosshair";
    }
  };

  // Get cursor class for styling
  const getCursorClass = () => {
    if (isLineTool) {
      return "cursor-line-drawing";
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative flex max-h-[95vh] max-w-[95vw] flex-col rounded-2xl bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 bg-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-100">Annotasi Gambar</h3>
            <span className="text-xs text-slate-500">{currentAnnotations.length} objek</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowToolOptions(!showToolOptions)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200">
              <ChevronDown size={18} className={`transition-transform ${showToolOptions ? "rotate-180" : ""}`} />
            </button>
            <button onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Enhanced Toolbar */}
        {showToolOptions && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 px-4 py-2 bg-slate-800/50">
            {/* Drawing Tools */}
            {/* Line & Shape Tools */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
              <ToolButton icon={<MousePointer2 size={16} />} label="Pilih" active={tool === "select"} onClick={() => setTool("select")} />
              <ToolButton icon={<MoveRight size={16} />} label="Garis" active={tool === "line"} onClick={() => setTool("line")} />
              <ToolButton icon={<MinusIcon size={16} />} label="Garis Putus" active={tool === "dashed-line"} onClick={() => setTool("dashed-line")} />
              <ToolButton icon={<MoveRight size={16} />} label="Panah" active={tool === "arrow"} onClick={() => setTool("arrow")} />
              <ToolButton icon={<ArrowRightLeft size={16} />} label="Panah double" active={tool === "arrow-double"} onClick={() => setTool("arrow-double")} />
              <ToolButton icon={<PanelTop size={16} />} label="Garis Lengkung" active={tool === "curved"} onClick={() => setTool("curved")} />
            </div>

            <div className="h-6 w-px bg-slate-600" />

            {/* Shape Tools */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
              <ToolButton icon={<Square size={16} />} label="Kotak" active={tool === "rect"} onClick={() => setTool("rect")} />
              <ToolButton icon={<Square size={16} />} label="Kotak Bulat" active={tool === "rect-rounded"} onClick={() => setTool("rect-rounded")} />
              <ToolButton icon={<Circle size={16} />} label="Lingkaran" active={tool === "circle"} onClick={() => setTool("circle")} />
              <ToolButton icon={<CircleDot size={16} />} label="Elips" active={tool === "ellipse"} onClick={() => setTool("ellipse")} />
              <ToolButton icon={<Triangle size={16} />} label="Segitiga" active={tool === "triangle"} onClick={() => setTool("triangle")} />
              <ToolButton icon={<Star size={16} />} label="Bintang" active={tool === "star"} onClick={() => setTool("star")} />
            </div>

            <div className="h-6 w-px bg-slate-600" />

            {/* Text & Callout Tools */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
              <ToolButton icon={<Type size={16} />} label="Teks" active={tool === "text"} onClick={() => setTool("text")} />
              <ToolButton icon={<Quote size={16} />} label="Kotak Teks" active={tool === "callout-box"} onClick={() => setTool("callout-box")} />
              <ToolButton icon={<MessageSquare size={16} />} label="Callout" active={tool === "callout"} onClick={() => setTool("callout")} />
            </div>

            <div className="h-6 w-px bg-slate-600" />

            {/* Drawing Modes */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
              <ToolButton icon={<PencilLine size={16} />} label="Freehand" active={tool === "freehand"} onClick={() => setTool("freehand")} />
              <ToolButton icon={<Highlighter size={16} />} label="Highlighter" active={tool === "highlighter"} onClick={() => setTool("highlighter")} />
              <ToolButton icon={<Ruler size={16} />} label="Penggaris" active={tool === "ruler"} onClick={() => setTool("ruler")} />
              <ToolButton icon={<Maximize2 size={16} />} label="Ukur" active={tool === "measurement"} onClick={() => setTool("measurement")} />
              <ToolButton icon={<Scissors size={16} />} label="Blur" active={tool === "blur"} onClick={() => setTool("blur")} />
            </div>

            <div className="h-6 w-px bg-slate-600" />

            {/* Color Picker */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-slate-300 hover:border-slate-500"
              >
                <span className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
                <Palette size={14} />
              </button>
              {showColorPicker && (
                <div className="absolute mt-24 z-10 p-3 bg-slate-800 border border-slate-600 rounded-xl shadow-xl">
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setColor(c); setShowColorPicker(false); }}
                        className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-1">
              <select
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-200"
              >
                {STROKE_WIDTHS.map((w) => (
                  <option key={w} value={w}>{w}px</option>
                ))}
              </select>
            </div>

            {/* Opacity */}
            <div className="flex items-center gap-1">
              <Droplet size={14} className="text-slate-400" />
              <select
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="rounded-lg border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-200"
              >
                {OPACITIES.map((o) => (
                  <option key={o} value={o}>{o}%</option>
                ))}
              </select>
            </div>

            {/* Text Options */}
            {needsTextOptions && (
              <>
                <div className="h-6 w-px bg-slate-600" />
                <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-lg">
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-slate-200"
                  >
                    {FONT_SIZES.map((s) => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                  <button onClick={() => setIsBold(!isBold)} className={`p-1.5 rounded ${isBold ? "bg-cyan-500/30 text-cyan-400" : "text-slate-400 hover:bg-slate-600"}`}>
                    <Bold size={14} />
                  </button>
                  <button onClick={() => setIsItalic(!isItalic)} className={`p-1.5 rounded ${isItalic ? "bg-cyan-500/30 text-cyan-400" : "text-slate-400 hover:bg-slate-600"}`}>
                    <Italic size={14} />
                  </button>
                  <button onClick={() => setTextAlign("left")} className={`p-1.5 rounded ${textAlign === "left" ? "bg-cyan-500/30 text-cyan-400" : "text-slate-400 hover:bg-slate-600"}`}>
                    <AlignLeft size={14} />
                  </button>
                </div>
              </>
            )}

            {/* Shape Fill Toggle */}
            {needsShapeOptions && (
              <button
                onClick={() => setIsFilled(!isFilled)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${isFilled ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "border border-slate-600 text-slate-400 hover:border-slate-500"}`}
              >
                <Layers size={14} />
                Isi
              </button>
            )}

            {/* Dashed Toggle */}
            <button
              onClick={() => setIsDashed(!isDashed)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${isDashed ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "border border-slate-600 text-slate-400 hover:border-slate-500"}`}
            >
              <MinusIcon size={14} />
              Putus
            </button>

            <div className="flex-1" />

            {/* Keyboard Shortcuts Help */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs ${showShortcuts ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "border border-slate-600 text-slate-400 hover:border-slate-500"}`}
              title="Keyboard Shortcuts"
            >
              <span className="font-mono text-[10px]">?</span>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)" className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30">
                <Undo2 size={16} />
              </button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)" className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-30">
                <Redo2 size={16} />
              </button>
              <button onClick={deleteLast} title="Hapus (Del)" className="p-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                <Trash2 size={16} />
              </button>
              <button onClick={deleteAllAnnotations} title="Hapus Semua" className="p-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                <Trash size={16} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-600" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
              <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="p-1.5 rounded text-slate-400 hover:text-slate-200">
                <ZoomOut size={14} />
              </button>
              <span className="min-w-[45px] text-center text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="p-1.5 rounded text-slate-400 hover:text-slate-200">
                <ZoomIn size={14} />
              </button>
              <button onClick={() => setZoom(1)} title="Fit" className="p-1.5 rounded text-slate-400 hover:text-slate-200">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="relative overflow-auto bg-slate-950 p-4"
          style={{ maxHeight: "70vh" }}
        >
          <div
            className="relative inline-block"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
          >
            <canvas
              ref={canvasRef}
              className={`max-w-full ${getCursorClass()}`}
              style={{
                maxHeight: "60vh",
                cursor: getCursorStyle(),
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onContextMenu={(e) => e.preventDefault()}
            />
            {/* Drawing state indicator */}
            <DrawingIndicator isDrawing={isDrawing} tool={tool} />
            {/* Mouse coordinate display */}
            <MouseCoordinates canvasRef={canvasRef} zoom={zoom} />
            {/* Shape guides */}
            <ShapeGuides canvasRef={canvasRef} tool={tool} color={color} zoom={zoom} />
          </div>
        </div>

        {/* Text Input Modal */}
        {textPosition && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-xl border border-slate-600 bg-slate-800 p-3 shadow-xl">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Masukkan teks..."
              autoFocus
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddText();
                if (e.key === "Escape") setTextPosition(null);
              }}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setTextPosition(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleAddText}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-cyan-400"
              >
                Tambah
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="absolute right-4 top-16 z-20 w-64 rounded-xl border border-slate-600 bg-slate-800 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-200">Keyboard Shortcuts</h4>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-slate-200">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Garis</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">L</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Panah</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">A</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kotak</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">R</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lingkaran</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">C</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teks</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">T</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Freehand</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">E</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Select</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">S</kbd>
              </div>
              <hr className="border-slate-700" />
              <div className="flex justify-between">
                <span className="text-slate-400">Undo</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Redo</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">Ctrl+Y</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Simpan</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hapus</span>
                <kbd className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">Del</kbd>
              </div>
              <hr className="border-slate-700" />
              <div className="flex justify-between">
                <span className="text-cyan-400">+ Shift</span>
                <span className="text-slate-500">Kunci 45°</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-700 px-4 py-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400"
          >
            <Download size={16} />
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// Thumbnail preview for photo list
interface AnnotationPreviewProps {
  url: string;
  annotationCount: number;
  onClick: () => void;
}

// Helper component to display mouse coordinates
function MouseCoordinates({ canvasRef, zoom }: { canvasRef: RefObject<HTMLCanvasElement | null>; zoom: number }) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setCoords({
        x: Math.round((e.clientX - rect.left) / zoom),
        y: Math.round((e.clientY - rect.top) / zoom),
      });
    };
    canvas.addEventListener("mousemove", handler);
    return () => canvas.removeEventListener("mousemove", handler);
  }, [canvasRef, zoom]);

  if (!coords) return null;
  return (
    <div className="absolute bottom-2 right-2 bg-slate-900/90 px-2 py-1 rounded text-xs text-slate-400 font-mono border border-slate-700">
      X: {coords.x} Y: {coords.y}
    </div>
  );
}

// Helper component for drawing shape guides (crosshairs, grid, snap points)
function ShapeGuides({ canvasRef, tool, color, zoom }: { canvasRef: RefObject<HTMLCanvasElement | null>; tool: AnnotationTool; color: string; zoom: number }) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / zoom);
      const y = Math.round((e.clientY - rect.top) / zoom);
      setMousePos({ x, y });

      // Update current line preview for line/arrow tools
      if (startPos) {
        const startX = Math.round(startPos.x / zoom);
        const startY = Math.round(startPos.y / zoom);
        setCurrentLine({ x1: startX, y1: startY, x2: x, y2: y });
      }
    };

    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const onUp = () => {
      if (startPos && mousePos) {
        const startX = Math.round(startPos.x / zoom);
        const startY = Math.round(startPos.y / zoom);
        setDimensions({ w: mousePos.x - startX, h: mousePos.y - startY });
        setTimeout(() => { setDimensions(null); setStartPos(null); setCurrentLine(null); }, 2000);
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mouseup", onUp);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mouseup", onUp);
    };
  }, [canvasRef, zoom, startPos, mousePos]);

  if (!mousePos) return null;

  const isLineTool = ["line", "arrow", "arrow-right", "arrow-up", "arrow-down"].includes(tool);
  const showGuides = ["rect", "circle", "ellipse", "line", "arrow", "arrow-right", "arrow-up", "arrow-down", "triangle", "star", "rect-rounded"].includes(tool);

  return (
    <>
      {/* Custom cursor indicator for line/arrow tools */}
      {isLineTool && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
          {/* Cursor crosshair */}
          <circle
            cx={mousePos.x}
            cy={mousePos.y}
            r={8}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4,2"
          />
          <line
            x1={mousePos.x - 12} y1={mousePos.y}
            x2={mousePos.x + 12} y2={mousePos.y}
            stroke={color}
            strokeWidth={1}
          />
          <line
            x1={mousePos.x} y1={mousePos.y - 12}
            x2={mousePos.x} y2={mousePos.y + 12}
            stroke={color}
            strokeWidth={1}
          />
          {/* Current line preview */}
          {currentLine && (
            <>
              <line
                x1={currentLine.x1}
                y1={currentLine.y1}
                x2={currentLine.x2}
                y2={currentLine.y2}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="8,4"
                opacity={0.7}
              />
              {/* Start point indicator */}
              <circle
                cx={currentLine.x1}
                cy={currentLine.y1}
                r={4}
                fill={color}
                stroke="#fff"
                strokeWidth={1}
              />
            </>
          )}
        </svg>
      )}

      {/* Crosshair guides */}
      {showGuides && !isLineTool && (
        <>
          <div className="absolute left-0 right-0 h-px bg-cyan-500/30 pointer-events-none" style={{ top: mousePos.y }} />
          <div className="absolute top-0 bottom-0 w-px bg-cyan-500/30 pointer-events-none" style={{ left: mousePos.x }} />
        </>
      )}

      {/* Distance from start point */}
      {startPos && dimensions && !isLineTool && (
        <div
          className="absolute bg-slate-900/90 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 border border-cyan-500/50 pointer-events-none whitespace-nowrap"
          style={{
            left: Math.min(startPos.x / zoom, mousePos.x) + 8,
            top: Math.min(startPos.y / zoom, mousePos.y) - 20,
          }}
        >
          W: {Math.abs(dimensions.w)}px H: {Math.abs(dimensions.h)}px
        </div>
      )}

      {/* Length display for line tool */}
      {isLineTool && currentLine && (
        <div
          className="absolute bg-slate-900/90 px-1.5 py-0.5 rounded text-[10px] text-cyan-400 border border-cyan-500/50 pointer-events-none whitespace-nowrap"
          style={{
            left: (currentLine.x1 + currentLine.x2) / 2 + 8,
            top: (currentLine.y1 + currentLine.y2) / 2 - 10,
          }}
        >
          {Math.round(Math.sqrt(Math.pow(currentLine.x2 - currentLine.x1, 2) + Math.pow(currentLine.y2 - currentLine.y1, 2)))}px
        </div>
      )}

      {/* Snap indicators for shapes */}
      {tool === "line" && (
        <SnapIndicator x={mousePos.x} y={mousePos.y} color={color} />
      )}
    </>
  );
}

// Snap point indicator with enhanced visibility
function SnapIndicator({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
      <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={2} strokeDasharray="3,2" opacity={0.8} />
      <circle cx={x} cy={y} r={3} fill={color} />
    </svg>
  );
}

// Drawing state indicator - shows when user is actively drawing
function DrawingIndicator({ isDrawing, tool }: { isDrawing: boolean; tool: AnnotationTool }) {
  const isLineTool = ["line", "arrow", "arrow-right", "arrow-up", "arrow-down"].includes(tool);

  return (
    <div
      className={`absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
        isDrawing ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-slate-800/80 text-slate-500 border border-slate-700"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isDrawing ? "bg-cyan-400 animate-pulse" : "bg-slate-500"}`} />
      {isDrawing ? (
        isLineTool ? "Mengambar garis..." : `Mengambar ${tool}...`
      ) : (
        "Siap menggambar"
      )}
    </div>
  );
}

export function AnnotationBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-900">
      {count > 9 ? "9+" : count}
    </span>
  ) : null;
}

// Helper component for tool buttons
function ToolButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-cyan-500/30 text-cyan-400"
          : "text-slate-400 hover:bg-slate-600 hover:text-slate-200"
      }`}
    >
      {icon}
    </button>
  );
}
