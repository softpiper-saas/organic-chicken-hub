"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Config = {
  id: string;
  url: string;
  isActive: boolean;
  lastScrapedAt: string | null;
};

export default function Dashboard() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const fetchConfigs = async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) {
      setConfigs(await res.json());
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const addUrl = async () => {
    if (!newUrl) return;
    setLoading(true);
    await fetch("/api/admin/config", {
      method: "POST",
      body: JSON.stringify({ url: newUrl }),
    });
    setNewUrl("");
    setLoading(false);
    fetchConfigs();
  };

  const deleteUrl = async (id: string) => {
    await fetch("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchConfigs();
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
        const res = await fetch("/api/scrape", { method: "POST" });
        const data = await res.json();
        alert(`Scrape completed! Processed ${data.data.length} items.`);
        fetchConfigs();
    } catch {
        alert("Scrape failed");
    } finally {
        setScraping(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manage Target URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/product/chicken"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <Button onClick={addUrl} disabled={loading}>Add</Button>
            </div>

            <div className="space-y-2">
              {configs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="truncate flex-1 mr-2">
                    <p className="font-medium truncate">{config.url}</p>
                    <p className="text-xs text-muted-foreground">
                      Last Scraped: {config.lastScrapedAt ? new Date(config.lastScrapedAt).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteUrl(config.id)}>
                    Remove
                  </Button>
                </div>
              ))}
              {configs.length === 0 && <p className="text-muted-foreground text-center">No URLs configured.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scraping Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Trigger a manual scrape of all configured URLs immediately.
            </p>
            <Button onClick={triggerScrape} disabled={scraping} className="w-full">
              {scraping ? "Scraping in progress..." : "Trigger Manual Scrape Now"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
