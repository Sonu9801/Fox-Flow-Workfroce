import React from "react";
import { useQuery } from "@tanstack/react-query";
import { componentsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function ComponentReportsTab() {
  const { data: components, isLoading } = useQuery({
    queryKey: ["allComponents"],
    queryFn: async () => {
      return await componentsApi.getAllTasks();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (!components || components.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No component tasks have been recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Components</h3>
            <p className="text-3xl font-bold text-gray-900">{components.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Completed</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {components.filter((c: any) => c.status === "completed").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">In Progress</h3>
            <p className="text-3xl font-bold text-orange-600">
              {components.filter((c: any) => c.status === "in_progress").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Production Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Number/ID</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Workers</th>
                  <th className="px-6 py-3 font-semibold">Start Time</th>
                  <th className="px-6 py-3 font-semibold">End Time</th>
                  <th className="px-6 py-3 font-semibold">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {components.map((comp: any) => (
                  <tr key={comp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{comp.component_type}</td>
                    <td className="px-6 py-4">{comp.component_number}</td>
                    <td className="px-6 py-4">
                      <Badge variant={comp.status === "completed" ? "secondary" : "default"} className={comp.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}>
                        {comp.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {comp.workers?.map((w: any) => (
                          <span key={w.id} className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {w.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {comp.start_time ? new Date(comp.start_time).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {comp.end_time ? new Date(comp.end_time).toLocaleString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {comp.photo_proof_url ? (
                        <a href={comp.photo_proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                          View Photo
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No Photo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
