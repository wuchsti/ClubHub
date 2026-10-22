"use client";

import { QRCodeSVG } from "qrcode.react";

export function InviteQr({ value }: { value: string }) {
  return (
    <div className="rounded-md border bg-white p-3">
      <QRCodeSVG value={value} size={160} />
    </div>
  );
}
