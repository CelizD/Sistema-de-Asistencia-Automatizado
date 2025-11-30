import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapProps {
  rows: number;
  cols: number;
  occupiedSeats: number[];
  totalSeats: number;
  title?: string;
  description?: string;
}

export default function Heatmap({ rows, cols, occupiedSeats, totalSeats, title, description }: HeatmapProps) {
  const grid = useMemo(() => {
    const seatGrid: { id: number; occupied: boolean }[][] = [];
    let seatId = 0;

    for (let r = 0; r < rows; r++) {
      const row: { id: number; occupied: boolean }[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          id: seatId,
          occupied: occupiedSeats.includes(seatId),
        });
        seatId++;
      }
      seatGrid.push(row);
    }

    return seatGrid;
  }, [rows, cols, occupiedSeats]);

  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats.length / totalSeats) * 100) : 0;

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>{title || "Mapa de Ocupación"}</CardTitle>
        <CardDescription>
          {description || `${occupiedSeats.length} de ${totalSeats} sillas ocupadas (${occupancyRate}%)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500"></div>
              <span>Ocupada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-600"></div>
              <span>Vacía</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div 
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((seat, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                      transition-all duration-200 hover:scale-110 cursor-pointer
                      ${seat.occupied 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-gray-600 text-gray-300'
                      }
                    `}
                    title={`Silla ${seat.id + 1}: ${seat.occupied ? 'Ocupada' : 'Vacía'}`}
                  >
                    {seat.id + 1}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Ocupación Total</span>
              <span className="text-2xl font-bold text-primary">{occupancyRate}%</span>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
