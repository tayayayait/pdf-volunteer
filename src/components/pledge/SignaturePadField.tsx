import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import SignaturePad from "signature_pad";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toPNG: () => string | null;
}

interface Props {
  onChange?: (dataUrl: string | null) => void;
  height?: number;
}

export const SignaturePadField = forwardRef<SignaturePadHandle, Props>(
  function SignaturePadField({ onChange, height = 200 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const padRef = useRef<SignaturePad | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
      const canvas = canvasRef.current!;
      const resize = () => {
        const savedData =
          padRef.current && !padRef.current.isEmpty() ? padRef.current.toData() : null;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")!.scale(ratio, ratio);
        padRef.current?.clear();
        if (savedData) padRef.current?.fromData(savedData);
      };
      const pad = new SignaturePad(canvas, {
        backgroundColor: "rgba(255,255,255,0)",
        penColor: "#111827",
        minWidth: 1.2,
        maxWidth: 3.2,
        velocityFilterWeight: 0.7,
      });
      padRef.current = pad;
      resize();
      window.addEventListener("resize", resize);

      pad.addEventListener("endStroke", () => {
        if (!pad.isEmpty()) onChangeRef.current?.(pad.toDataURL("image/png"));
      });

      return () => {
        window.removeEventListener("resize", resize);
        pad.off();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => {
        padRef.current?.clear();
        onChangeRef.current?.(null);
      },
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toPNG: () =>
        padRef.current && !padRef.current.isEmpty()
          ? padRef.current.toDataURL("image/png")
          : null,
    }));

    return (
      <div className="relative rounded-md border border-[var(--color-line)] bg-white">
        <canvas
          ref={canvasRef}
          aria-label="기부자 전자서명 입력 영역"
          className="block w-full touch-none"
          style={{ height }}
        />
        <div
          className="pointer-events-none absolute right-4 bottom-12 left-4 border-b border-dashed"
          style={{ borderColor: "#AAB4C0" }}
        />
        <span className="pointer-events-none absolute right-4 bottom-2 text-[12px] text-[var(--color-muted-ink)]">
          서명선
        </span>
      </div>
    );
  },
);
