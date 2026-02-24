import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeedtestLogic() {
  const [status, setStatus] = useState("Parado...");
  const [ping, setPing] = useState(0);
  const [download, setDownload] = useState(0);
  const [upload, setUpload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pingRef = useRef<HTMLSpanElement>(null);
  const downloadRef = useRef<HTMLSpanElement>(null);
  const uploadRef = useRef<HTMLSpanElement>(null);

  const startTest = async () => {
    setLoading(true);
    setError("");
    setStatus("Testando ping...");

    try {
      await invoke("teste_velocidade_aegis");
    } catch (error) {
      console.error(error);
      setError(`${error}, tente novamente depois.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unlistenStatus = listen("speed-status", (event) =>
      setStatus(event.payload as string),
    );
    const unlistenPing = listen("speed-ping", (event) =>
      setPing(event.payload as number),
    );
    const unlistenDownload = listen("speed-download", (event) =>
      setDownload(event.payload as number),
    );
    const unlistenUpload = listen("speed-upload", (event) =>
      setUpload(event.payload as number),
    );

    return () => {
      unlistenStatus.then((f) => f());
      unlistenPing.then((f) => f());
      unlistenDownload.then((f) => f());
      unlistenUpload.then((f) => f());
    };
  }, []);

  const animateValue = useCallback(
    (ref: React.RefObject<HTMLSpanElement | null>, value: number) => {
      const startVal = Number(ref.current?.innerText) || 0;
      const obj = { val: startVal };
      gsap.to(obj, {
        val: value,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = Number(obj.val).toFixed(1);
          }
        },
      });
    },
    [],
  );

  useEffect(() => {
    animateValue(pingRef, ping);
  }, [ping, animateValue]);

  useEffect(() => {
    animateValue(downloadRef, download);
  }, [download, animateValue]);

  useEffect(() => {
    animateValue(uploadRef, upload);
  }, [upload, animateValue]);

  return {
    status,
    ping,
    download,
    upload,
    loading,
    error,
    pingRef,
    downloadRef,
    uploadRef,
    startTest,
  };
}
