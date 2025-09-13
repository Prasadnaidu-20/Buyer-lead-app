"use client";

import { useState } from "react";
import { City, PropertyType, BHK, Purpose, Timeline, Source, Status } from "@prisma/client";

export default function BuyersPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<City>(City.Chandigarh);
  const [propertyType, setPropertyType] = useState<PropertyType>(PropertyType.Apartment);
  const [bhk, setBhk] = useState<BHK | "">("");
  const [purpose, setPurpose] = useState<Purpose>(Purpose.Buy);
  const [timeline, setTimeline] = useState<Timeline>(Timeline.ZERO_TO_3M);
  const [source, setSource] = useState<Source>(Source.Website);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          city,
          propertyType,
          bhk: bhk || null,
          purpose,
          timeline,
          source,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data.error}`);
      } else {
        setMessage(`Buyer created! ID: ${data.id}`);
      }
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Create Buyer</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
          className="border p-2 rounded"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="border p-2 rounded"
          required
        />
        <select value={city} onChange={(e) => setCity(e.target.value as City)} className="border p-2 rounded">
          {Object.values(City).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} className="border p-2 rounded">
          {Object.values(PropertyType).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(propertyType === PropertyType.Apartment || propertyType === PropertyType.Villa) && (
          <select value={bhk} onChange={(e) => setBhk(e.target.value as BHK)} className="border p-2 rounded" required>
            <option value="">Select BHK</option>
            {Object.values(BHK).map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        <select value={purpose} onChange={(e) => setPurpose(e.target.value as Purpose)} className="border p-2 rounded">
          {Object.values(Purpose).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={timeline} onChange={(e) => setTimeline(e.target.value as Timeline)} className="border p-2 rounded">
          {Object.values(Timeline).map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value as Source)} className="border p-2 rounded">
          {Object.values(Source).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Create Buyer</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
