"use client";

import { useState } from "react";

type Props = {
  onSearch: (value: string) => void;
};

export default function OrderSearch({ onSearch }: Props) {
  const [value, setValue] = useState("");

  function handleChange(newValue: string) {
    setValue(newValue);
    onSearch(newValue);
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Search customer or email..."
      style={{
        width: "100%",
        maxWidth: "500px",
        padding: "12px 14px",
        borderRadius: "10px",
        border: "1px solid #3b3b50",
        background: "#11111a",
        color: "white",
        fontSize: "16px",
        outline: "none",
      }}
    />
  );
}