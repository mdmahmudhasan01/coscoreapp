import React, { useEffect, useState } from "react";
import { fetchActiveGateways } from "@/lib/coscore-api";

interface GatewayOption {
  id: string;
  label: string;
}

export const PaymentGatewaySelect: React.FC<{ onSelect: (gateway: string) => void }> = ({ onSelect }) => {
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [selected, setSelected] = useState<string>("cod");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveGateways();
        if (Array.isArray(data) && data.length) {
          setGateways(data.map((g: any) => ({ id: g.name, label: g.label })));
        } else {
          setGateways([
            { id: "cod", label: "Cash on Delivery" },
            { id: "paystack", label: "Paystack" },
          ]);
        }
      } catch {
        setGateways([
          { id: "cod", label: "Cash on Delivery" },
          { id: "paystack", label: "Paystack" },
        ]);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelected(val);
    onSelect(val);
  };

  return (
    <div className="gateway-select mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
      <div className="space-y-2">
        {gateways.map((g) => (
          <label key={g.id} className="inline-flex items-center">
            <input
              type="radio"
              name="gateway"
              value={g.id}
              checked={selected === g.id}
              onChange={handleChange}
              className="form-radio"
            />
            <span className="ml-2">{g.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
